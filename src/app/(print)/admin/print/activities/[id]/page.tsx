import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CATEGORY_NAMES } from "@/lib/constants"
import AutoPrint from "@/components/admin/auto-print"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrintActivityPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const { id } = await params

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      participations: {
        include: {
          student: {
            select: { studentId: true, prefix: true, firstName: true, lastName: true, year: true, department: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  })

  if (!activity) redirect("/admin/activities")

  const printedAt = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-white font-thai">
      <AutoPrint />

      <div className="max-w-4xl mx-auto p-8 print:p-4">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-blue-800 pb-4">
          <h1 className="text-xl font-bold text-blue-900">{activity.name}</h1>
          <p className="text-sm text-gray-500 mt-1">รายชื่อผู้เข้าร่วมกิจกรรม</p>
        </div>

        {/* Activity info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6 bg-gray-50 p-4 rounded-lg print:bg-white print:border">
          <div><span className="text-gray-500">ประเภท: </span>{CATEGORY_NAMES[activity.category]}</div>
          <div><span className="text-gray-500">สถานะ: </span>{STATUS_LABELS[activity.status]}</div>
          <div><span className="text-gray-500">ปีการศึกษา: </span>{activity.targetYear}</div>
          <div><span className="text-gray-500">ภาคเรียน: </span>{activity.targetSemester}</div>
          <div><span className="text-gray-500">วันที่จัดกิจกรรม: </span>{activity.startDate.toLocaleDateString("th-TH")}</div>
          {activity.location && (
            <div><span className="text-gray-500">สถานที่: </span>{activity.location}</div>
          )}
          <div className="col-span-2 font-semibold text-blue-800 mt-1">
            ผู้เข้าร่วมทั้งหมด: {activity.participations.length} คน
          </div>
        </div>

        {/* Participant table */}
        {activity.participations.length === 0 ? (
          <p className="text-center text-gray-400 py-12">ยังไม่มีผู้เข้าร่วมกิจกรรม</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="px-3 py-2 text-center w-10">ลำดับ</th>
                <th className="px-3 py-2 text-left w-32">รหัสนักศึกษา</th>
                <th className="px-3 py-2 text-left">ชื่อ-สกุล</th>
                <th className="px-3 py-2 text-center w-20">ระดับชั้น</th>
                <th className="px-3 py-2 text-left">แผนก</th>
                <th className="px-3 py-2 text-center w-32">วันที่เข้าร่วม</th>
              </tr>
            </thead>
            <tbody>
              {activity.participations.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5 text-center text-gray-400">{i + 1}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{p.student.studentId}</td>
                  <td className="px-3 py-1.5">{p.student.prefix}{p.student.firstName} {p.student.lastName}</td>
                  <td className="px-3 py-1.5 text-center">{p.student.year}</td>
                  <td className="px-3 py-1.5 text-gray-600">{p.student.department}</td>
                  <td className="px-3 py-1.5 text-center text-gray-600">
                    {new Date(p.joinedAt).toLocaleDateString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 text-xs text-gray-400 flex justify-between border-t pt-3">
          <span>พิมพ์เมื่อ: {printedAt}</span>
          <span>ระบบบริหารจัดการกิจกรรมนักศึกษา</span>
        </div>
      </div>
    </div>
  )
}
