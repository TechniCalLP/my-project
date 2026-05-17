import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CATEGORY_NAMES } from "@/lib/constants"
import AutoPrint from "@/components/admin/auto-print"

export default async function PrintDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const [students, activities, participations] = await Promise.all([
    prisma.student.findMany({ select: { department: true, year: true, isActive: true } }),
    prisma.activity.findMany({
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
