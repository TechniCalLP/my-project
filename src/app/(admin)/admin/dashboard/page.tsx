import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ActivityStatus } from "@/generated/prisma"
import StatsCards from "@/components/admin/stats-cards"
import RecentActivities from "@/components/admin/recent-activities"
import DashboardEvaluationChart from "@/components/admin/dashboard-evaluation-chart"
import EvaluationPeriodSelect from "@/components/admin/evaluation-period-select"
import { Suspense } from "react"
import ExportDropdown from "@/components/admin/export-dropdown"
import { ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { getStudentEvaluations } from "@/lib/evaluation"

interface PageProps {
  searchParams: Promise<{ academicYear?: string; semester?: string }>
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const isManagement = session.user.adminRole !== "TEACHER"
  const params = await searchParams
  const academicYear = params.academicYear ?? ACADEMIC_YEARS[0]
  const semester = params.semester ?? SEMESTERS[0]

  const [totalActivities, activeActivities, totalStudents, totalParticipations, recentActivities] =
    await Promise.all([
      prisma.activity.count({ where: { isDeleted: false } }),
      prisma.activity.count({ where: { isDeleted: false, status: ActivityStatus.ACTIVE } }),
      prisma.student.count(),
      prisma.participation.count(),
      prisma.activity.findMany({
        where: { isDeleted: false },
        include: { _count: { select: { participations: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

  const stats = [
    { label: "กิจกรรมทั้งหมด", value: totalActivities, icon: "calendar" as const },
    { label: "กิจกรรมที่เปิดรับ", value: activeActivities, icon: "calendar" as const, valueClass: "text-primary-500" },
    { label: "นักศึกษาทั้งหมด", value: totalStudents, icon: "users" as const },
    { label: "การเข้าร่วมทั้งหมด", value: totalParticipations, icon: "clipboard" as const },
  ]

  let evaluationChart = null
  if (isManagement) {
    const [activeStudents, topActivitiesRaw, studentsWithParticipationCounts] = await Promise.all([
      prisma.student.findMany({ where: { isActive: true }, select: { id: true } }),
      prisma.activity.findMany({
        where: { isDeleted: false },
        select: { name: true, _count: { select: { participations: true } } },
        orderBy: { participations: { _count: "desc" } },
        take: 8,
      }),
      prisma.student.findMany({
        where: { isActive: true },
        select: { year: true, _count: { select: { participations: true } } },
      }),
    ])

    const evaluations = await getStudentEvaluations(activeStudents.map((s) => s.id), academicYear, semester)
    let passCount = 0
    let failCount = 0
    let pendingCount = 0
    for (const ev of evaluations.values()) {
      if (ev.overall === "PASS") passCount++
      else if (ev.overall === "FAIL") failCount++
      else pendingCount++
    }

    const topActivities = topActivitiesRaw
      .filter((a) => a._count.participations > 0)
      .map((a) => ({ name: a.name, participants: a._count.participations }))

    // Participation RATE per year level (% of that year's own students who joined at
    // least one activity) — not a raw total, since year levels have different student
    // counts and activity loads, so raw totals aren't directly comparable.
    const yearTotals = new Map<string, { total: number; participated: number }>()
    for (const s of studentsWithParticipationCounts) {
      const entry = yearTotals.get(s.year) ?? { total: 0, participated: 0 }
      entry.total++
      if (s._count.participations > 0) entry.participated++
      yearTotals.set(s.year, entry)
    }
    const participationByYear = YEARS.map((year) => {
      const entry = yearTotals.get(year) ?? { total: 0, participated: 0 }
      const rate = entry.total > 0 ? Math.round((entry.participated / entry.total) * 100) : 0
      return { year, rate, participated: entry.participated, total: entry.total }
    })

    evaluationChart = { passCount, failCount, pendingCount, topActivities, participationByYear }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold font-thai">แดชบอร์ดผู้ดูแลระบบ</h1>
        <div className="flex gap-2">
          <Suspense>
            <ExportDropdown
              excelUrl={`/api/admin/export/dashboard?academicYear=${encodeURIComponent(academicYear)}&semester=${encodeURIComponent(semester)}`}
              printUrl="/admin/print/dashboard"
            />
          </Suspense>
          <Link href="/admin/activities/new">
            <Button className="font-thai">+ สร้างกิจกรรม</Button>
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />

      {evaluationChart && (
        <div className="space-y-4">
          <Suspense>
            <EvaluationPeriodSelect academicYear={academicYear} semester={semester} basePath="/admin/dashboard" />
          </Suspense>
          <DashboardEvaluationChart
            passCount={evaluationChart.passCount}
            failCount={evaluationChart.failCount}
            pendingCount={evaluationChart.pendingCount}
            topActivities={evaluationChart.topActivities}
            participationByYear={evaluationChart.participationByYear}
          />
        </div>
      )}

      <RecentActivities activities={recentActivities} />
    </div>
  )
}
