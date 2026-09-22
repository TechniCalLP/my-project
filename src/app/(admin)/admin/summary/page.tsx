import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ListChecks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import StatsCards from "@/components/admin/stats-cards"
import SummaryFilters from "@/components/admin/summary-filters"
import SummaryClubSection from "@/components/admin/summary-club-section"
import { getStudentEvaluations } from "@/lib/evaluation"
import { ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { clubDepartmentVariants, resolveClubById } from "@/lib/club"

interface PageProps {
  searchParams: Promise<{ academicYear?: string; semester?: string; club?: string; search?: string; status?: string }>
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const isTeacher = session.user.adminRole === "TEACHER"
  let scopedClubId: string | null = null
  let scopedClubName: string | null = null
  let allClubs: { id: string; name: string }[] = []

  const params = await searchParams

  if (isTeacher) {
    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { club: { include: { departments: true } } },
    })
    if (!teacher?.club) {
      return (
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="py-12 text-center text-gray-500 font-thai">
              บัญชีของท่านยังไม่ได้ผูกกับชมรม กรุณาติดต่อผู้ดูแลระบบ
            </CardContent>
          </Card>
        </div>
      )
    }
    scopedClubId = teacher.club.id
    scopedClubName = teacher.club.name
  } else {
    allClubs = await prisma.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    if (params.club) {
      const club = await resolveClubById(params.club)
      if (club) {
        scopedClubId = club.id
        scopedClubName = club.name
      }
    }
  }

  const academicYear = params.academicYear ?? ACADEMIC_YEARS[0]
  const semester = params.semester ?? SEMESTERS[0]
  const search = params.search?.trim().toLowerCase() ?? ""
  const status = params.status === "pass" || params.status === "fail" || params.status === "pending" ? params.status : "all"

  const activities = await prisma.vocationalActivity.findMany({
    where: {
      academicYear,
      semester,
      ...(scopedClubId ? { clubs: { some: { id: scopedClubId } } } : {}),
    },
    select: {
      id: true,
      name: true,
      targetYears: true,
      clubs: { select: { id: true, name: true, departments: { select: { name: true, aliases: true } } } },
    },
  })

  // One card per (club, year) combination that has a configured vocational
  // activity — mirrors how activities are actually set up on the
  // กิจกรรมองค์การวิชาชีพ page, instead of lumping every club's students
  // together under a single per-year total.
  interface ClubYearGroup {
    clubId: string
    clubName: string
    year: string
    deptVariants: string[]
    activityNames: Set<string>
  }
  const groupsByKey = new Map<string, ClubYearGroup>()
  for (const activity of activities) {
    const years = activity.targetYears.length === 0 ? YEARS : activity.targetYears
    // An activity can target multiple clubs at once (e.g. a general mandatory
    // activity applied broadly) — when scoped to one club, only build a card
    // for that club, not every club the activity happens to also target.
    const relevantClubs = scopedClubId ? activity.clubs.filter((c) => c.id === scopedClubId) : activity.clubs
    for (const club of relevantClubs) {
      for (const year of years) {
        const key = `${club.id}::${year}`
        if (!groupsByKey.has(key)) {
          groupsByKey.set(key, {
            clubId: club.id,
            clubName: club.name,
            year,
            deptVariants: clubDepartmentVariants(club),
            activityNames: new Set(),
          })
        }
        groupsByKey.get(key)!.activityNames.add(activity.name)
      }
    }
  }

  // One bulk fetch of every active student in any involved year, then bucket
  // into (club, year) groups in memory — instead of one findMany per group
  // (51 separate queries on the all-clubs SUPER_ADMIN view). Combined with
  // batching getStudentEvaluations itself, this page now issues a fixed
  // small number of queries regardless of how many club/year cards it shows.
  const involvedYears = [...new Set([...groupsByKey.values()].map((g) => g.year))]
  const candidateStudents =
    involvedYears.length > 0
      ? await prisma.student.findMany({
          where: { isActive: true, year: { in: involvedYears } },
          select: { id: true, year: true, department: true },
        })
      : []

  const groupStudentIds = [...groupsByKey.values()].map((group) => ({
    group,
    studentIds: candidateStudents
      .filter((s) => s.year === group.year && group.deptVariants.includes(s.department))
      .map((s) => s.id),
  }))

  const allStudentIds = [...new Set(groupStudentIds.flatMap((g) => g.studentIds))]
  const evaluations = await getStudentEvaluations(allStudentIds, academicYear, semester)

  const gradeGroups = groupStudentIds.map(({ group, studentIds }) => {
    if (studentIds.length === 0) return null

    // Counted per distinct student (evaluation.overall — pass only if every
    // required part, participation and every vocational activity, passed),
    // not per activity, so this always sums to exactly `total`.
    let passCount = 0
    let failCount = 0
    let pendingCount = 0
    for (const id of studentIds) {
      const evaluation = evaluations.get(id)
      if (!evaluation) continue
      if (evaluation.overall === "PASS") passCount++
      else if (evaluation.overall === "FAIL") failCount++
      else pendingCount++
    }

    return {
      year: group.year,
      clubId: group.clubId,
      clubName: group.clubName,
      total: studentIds.length,
      passCount,
      failCount,
      pendingCount,
      activityNames: [...group.activityNames],
    }
  })

  const yearCards = gradeGroups
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => YEARS.indexOf(a.year as (typeof YEARS)[number]) - YEARS.indexOf(b.year as (typeof YEARS)[number]) || a.clubName.localeCompare(b.clubName, "th"))

  // KPI totals reflect the scoped (period + club) data — not the search/status
  // filters below, so the top numbers stay a stable overview while the card
  // list is narrowed.
  const totalStudents = yearCards.reduce((sum, g) => sum + g.total, 0)
  const totalPass = yearCards.reduce((sum, c) => sum + c.passCount, 0)
  const totalFail = yearCards.reduce((sum, c) => sum + c.failCount, 0)
  const totalPending = yearCards.reduce((sum, c) => sum + c.pendingCount, 0)

  const filteredGroups = yearCards.filter((g) => {
    if (search) {
      const haystack = `${g.clubName} ${g.activityNames.join(" ")}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (status === "pass" && g.passCount === 0) return false
    if (status === "fail" && g.failCount === 0) return false
    if (status === "pending" && g.pendingCount === 0) return false
    return true
  })

  const sectionsByClub = new Map<string, { clubName: string; cards: typeof filteredGroups }>()
  for (const g of filteredGroups) {
    if (!sectionsByClub.has(g.clubId)) sectionsByClub.set(g.clubId, { clubName: g.clubName, cards: [] })
    sectionsByClub.get(g.clubId)!.cards.push(g)
  }
  const sections = [...sectionsByClub.values()].sort((a, b) => a.clubName.localeCompare(b.clubName, "th"))

  const kpis = [
    {
      icon: "users" as const,
      label: `จำนวนผู้เรียนรวม${scopedClubName ? "" : "ทุกชมรม"}`,
      value: `${totalStudents.toLocaleString("th-TH")} คน`,
    },
    {
      icon: "check" as const,
      label: "ผ่านการประเมินแล้ว",
      value: `${totalPass.toLocaleString("th-TH")} คน`,
      valueClass: "text-success",
    },
    {
      icon: "clock" as const,
      label: "รอดำเนินการตรวจสอบ",
      value: `${totalPending.toLocaleString("th-TH")} คน`,
    },
    {
      icon: "alert" as const,
      label: "ยังไม่ผ่านเกณฑ์ขั้นต่ำ",
      value: `${totalFail.toLocaleString("th-TH")} คน`,
      valueClass: "text-destructive",
    },
  ]

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">สรุปผลการประเมินกิจกรรมชมรม</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">
          ผลรวมกิจกรรมภาคบังคับและกิจกรรมองค์การวิชาชีพ แยกตามชมรมและชั้นปี
          {scopedClubName && ` — ${scopedClubName}`}
        </p>
      </div>

      <StatsCards stats={kpis} />

      <Suspense>
        <SummaryFilters academicYear={academicYear} semester={semester} isTeacher={isTeacher} clubs={allClubs} />
      </Suspense>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 font-thai">
            ไม่พบข้อมูลตามเงื่อนไขที่เลือก
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <SummaryClubSection
              key={section.clubName}
              clubName={section.clubName}
              cards={section.cards}
              academicYear={academicYear}
              semester={semester}
            />
          ))}
        </div>
      )}
    </div>
  )
}
