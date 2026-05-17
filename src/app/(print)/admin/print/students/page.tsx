import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AutoPrint from "@/components/admin/auto-print"

interface PageProps {
  searchParams: Promise<{ year?: string; department?: string; status?: string }>
}

export default async function PrintStudentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const params = await searchParams
  const where: Record<string, unknown> = {}
  if (params.year) where.year = params.year
  if (params.department) where.department = params.department
  if (params.status) where.isActive = params.status === "active"

  const students = await prisma.student.findMany({
    where,
    include: { _count: { select: { participations: true } } },
    orderBy: [{ year: "asc" }, { department: "asc" }, { studentId: "asc" }],
  })

  const printedAt = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-white font-thai">
      <AutoPrint />

      <div className="max-w-5xl mx-auto p-8 print:p-4">
        <div className="text-center mb-6 border-b-2 border-blue-800 pb-4">
          <h1 className="text-xl font-bold text-blue-900">รายชื่อนักศึกษา</h1>
          <p className="text-sm text-gray-500 mt-1">
            {params.department && `แผนก: ${params.department} • `}
            {params.year && `ชั้นปี: ${params.year} • `}
            ทั้งหมด {students.length} คน
          </p>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="px-3 py-2 text-center w-10">ลำดับ</th>
              <th className="px-3 py-2 text-left w-32">รหัสนักศึกษา</th>
              <th className="px-3 py-2 text-left">ชื่อ-สกุล</th>
              <th className="px-3 py-2 text-left w-40">แผนก</th>
              <th className="px-3 py-2 text-center w-20">ชั้นปี</th>
              <th className="px-3 py-2 text-center w-20">สถานะ</th>
              <th className="px-3 py-2 text-center w-20">กิจกรรม</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-1.5 text-center text-gray-400">{i + 1}</td>
                <td className="px-3 py-1.5 font-mono text-xs">{s.studentId}</td>
                <td className="px-3 py-1.5">{s.prefix}{s.firstName} {s.lastName}</td>
                <td className="px-3 py-1.5 text-gray-600">{s.department}</td>
                <td className="px-3 py-1.5 text-center">{s.year}</td>
                <td className="px-3 py-1.5 text-center">
                  <span className={s.isActive ? "text-green-700" : "text-gray-400"}>
                    {s.isActive ? "ใช้งาน" : "ปิด"}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-center">{s._count.participations}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 text-xs text-gray-400 flex justify-between border-t pt-3 print:mt-4">
          <span>พิมพ์เมื่อ: {printedAt}</span>
          <span>ระบบบริหารจัดการกิจกรรมนักศึกษา</span>
        </div>
      </div>
    </div>
  )
}
