import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CATEGORY_NAMES, ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { getStudentEvaluations, summarizeRequiredActivities } from "@/lib/evaluation"
import AutoPrint from "@/components/admin/auto-print"
import DashboardEvaluationChart from "@/components/admin/dashboard-evaluation-chart"

interface PageProps {
  searchParams: Promise<{ academicYear?: string; semester?: string }>
}

export default async function PrintDashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const isManagement = (session.user as { adminRole?: string }).adminRole !== "TEACHER"
  const params = await searchParams
  const academicYear = params.academicYear ?? ACADEMIC_YEARS[0]
  const semester = params.semester ?? SEMESTERS[0]

  const [students, activities, participations] = await Promise.all([
    prisma.student.findMany({ select: { id: true, department: true, year: true, isActive: true } }),
    prisma.activity.findMany({
      where: { isDeleted: false },
      include: { _count: { select: { participations: true } } },
    }),
    prisma.participation.count(),
  ])

  const byDept: Record<string, number> = {}
  students.forEach((s) => { byDept[s.department] = (byDept[s.department] || 0) + 1 })
  const deptEntries = Object.entries(byDept).sort((a, b) => b[1] - a[1])

  const byCat: Record<string, { total: number; participants: number }> = {}
  activities.forEach((a) => {
    const name = CATEGORY_NAMES[a.category]
    if (!byCat[name]) byCat[name] = { total: 0, participants: 0 }
    byCat[name].total++
    byCat[name].participants += a._count.participations
  })

  let evaluationChart = null
  if (isManagement) {
    const activeStudents = students.filter((s) => s.isActive)

    const [evaluations, studentsWithParticipationCounts] = await Promise.all([
      getStudentEvaluations(activeStudents.map((s) => s.id), academicYear, semester),
      prisma.student.findMany({
        where: { isActive: true },
        select: { year: true, _count: { select: { participations: true } } },
      }),
    ])

    let passCount = 0
    let failCount = 0
    let pendingCount = 0
    for (const ev of evaluations.values()) {
      if (ev.overall === "PASS") passCount++
      else if (ev.overall === "FAIL") failCount++
      else pendingCount++
    }

    const topActivities = [...activities]
      .sort((a, b) => b._count.participations - a._count.participations)
      .filter((a) => a._count.participations > 0)
      .slice(0, 8)
      .map((a) => ({ name: a.name, participants: a._count.participations }))

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

    const activityPassFail = summarizeRequiredActivities(evaluations)

    evaluationChart = { passCount, failCount, pendingCount, topActivities, participationByYear, activityPassFail }
  }

  const printedAt = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-white font-thai">
      <AutoPrint />

      <div className="max-w-4xl mx-auto p-8 print:p-4 space-y-8">
        <div className="text-center border-b-2 border-blue-800 pb-4">
          <h1 className="text-xl font-bold text-blue-900">รายงานภาพรวมระบบ</h1>
          <p className="text-sm text-gray-500 mt-1">พิมพ์เมื่อ: {printedAt}</p>
        </div>

        {/* Overview */}
        <div>
          <h2 className="font-semibold text-blue-800 mb-3">ภาพรวม</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "นักศึกษาทั้งหมด", value: students.length },
              { label: "นักศึกษาที่ใช้งาน", value: students.filter(s => s.isActive).length },
              { label: "กิจกรรมทั้งหมด", value: activities.length },
              { label: "การเข้าร่วมทั้งหมด", value: participations },
            ].map((item) => (
              <div key={item.label} className="border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-800">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation charts */}
        {evaluationChart && (
          <div>
            <h2 className="font-semibold text-blue-800 mb-3">
              สถิติการเข้าร่วมกิจกรรม (ปีการศึกษา {academicYear} ภาคเรียนที่ {semester})
            </h2>
            <DashboardEvaluationChart
              passCount={evaluationChart.passCount}
              failCount={evaluationChart.failCount}
              pendingCount={evaluationChart.pendingCount}
              topActivities={evaluationChart.topActivities}
              participationByYear={evaluationChart.participationByYear}
              activityPassFail={evaluationChart.activityPassFail}
            />
          </div>
        )}

        {/* By department */}
        <div>
          <h2 className="font-semibold text-blue-800 mb-3">นักศึกษาแยกตามแผนก</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-3 py-2 text-left">แผนก</th>
                <th className="px-3 py-2 text-right w-32">จำนวนนักศึกษา</th>
              </tr>
            </thead>
            <tbody>
              {deptEntries.map(([dept, count], i) => (
                <tr key={dept} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5">{dept}</td>
                  <td className="px-3 py-1.5 text-right">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By category */}
        <div>
          <h2 className="font-semibold text-blue-800 mb-3">กิจกรรมแยกตามประเภท</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-3 py-2 text-left">ประเภทกิจกรรม</th>
                <th className="px-3 py-2 text-right w-32">จำนวนกิจกรรม</th>
                <th className="px-3 py-2 text-right w-32">ผู้เข้าร่วมรวม</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCat).map(([cat, data], i) => (
                <tr key={cat} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5">{cat}</td>
                  <td className="px-3 py-1.5 text-right">{data.total}</td>
                  <td className="px-3 py-1.5 text-right">{data.participants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-400 text-right border-t pt-3">
          ระบบบริหารจัดการกิจกรรมนักศึกษา
        </div>
      </div>
    </div>
  )
}
