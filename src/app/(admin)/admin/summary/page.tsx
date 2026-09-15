import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ListChecks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import EvaluationPeriodSelect from "@/components/admin/evaluation-period-select"
import SummaryGradeCard from "@/components/admin/summary-grade-card"
import SummaryClubFilter from "@/components/admin/summary-club-filter"
import { getStudentEvaluations } from "@/lib/evaluation"
import { ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { clubDepartmentVariants, resolveClubById } from "@/lib/club"

interface PageProps {
  searchParams: Promise<{ academicYear?: string; semester?: string; club?: string }>
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const isTeacher = session.user.adminRole === "TEACHER"
  let scopedClubId: string | null = null
  let scopedClubName: string | null = null
  let scopedDepartmentVariants: string[] | null = null
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
    scopedDepartmentVariants = clubDepartmentVariants(teacher.club)
  } else {
    allClubs = await prisma.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    if (params.club) {
      const club = await resolveClubById(params.club)
      if (club) {
        scopedClubId = club.id
        scopedClubName = club.name
        scopedDepartmentVariants = clubDepartmentVariants(club)
      }
    }
  }

  const academicYear = params.academicYear ?? ACADEMIC_YEARS[0]
  const semester = params.semester ?? SEMESTERS[0]

  const activities = await prisma.vocationalActivity.findMany({
    where: {
      academicYear,
      semester,
      ...(scopedClubId ? { clubs: { some: { id: scopedClubId } } } : {}),
    },
    select: { name: true, targetYears: true },
  })

  const gradeGroups = await Promise.all(
    YEARS.map(async (year) => {
      const applicableActivities = activities.filter(
        (a) => a.targetYears.length === 0 || a.targetYears.includes(year)
      )
      if (applicableActivities.length === 0) return null

      const where = {
        isActive: true,
        year,
        ...(scopedDepartmentVariants ? { department: { in: scopedDepartmentVariants } } : {}),
      }
      const students = await prisma.student.findMany({ where, select: { id: true } })
      if (students.length === 0) return null

      const evaluations = await getStudentEvaluations(students.map((s) => s.id), academicYear, semester)

      let passCount = 0
      let failCount = 0
      let pendingCount = 0
      for (const evaluation of evaluations.values()) {
        if (evaluation.overall === "PASS") passCount++
        else if (evaluation.overall === "FAIL") failCount++
        else pendingCount++
      }

      const activityNames = [...new Set(applicableActivities.map((a) => a.name))]

      return { year, total: students.length, passCount, failCount, pendingCount, activityNames }
    })
  )

  const visibleGroups = gradeGroups.filter((g): g is NonNullable<typeof g> => g !== null)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">สรุปผลการประเมิน</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">
          ผลรวมกิจกรรมภาคบังคับและกิจกรรมองค์การวิชาชีพ แยกตามชั้นปี
          {scopedClubName && ` — ชมรม${scopedClubName}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Suspense>
          <EvaluationPeriodSelect academicYear={academicYear} semester={semester} basePath="/admin/summary" />
        </Suspense>
        {!isTeacher && (
          <Suspense>
            <SummaryClubFilter clubs={allClubs} />
          </Suspense>
        )}
      </div>

      {visibleGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 font-thai">
            ยังไม่พบนักศึกษาสำหรับช่วงเวลานี้
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGroups.map((g) => (
            <SummaryGradeCard
              key={g.year}
              year={g.year}
              academicYear={academicYear}
              semester={semester}
              clubId={scopedClubId ?? undefined}
              total={g.total}
              passCount={g.passCount}
              failCount={g.failCount}
              pendingCount={g.pendingCount}
              activityNames={g.activityNames}
            />
          ))}
        </div>
      )}
    </div>
  )
}
