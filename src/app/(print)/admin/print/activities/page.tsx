import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import AutoPrint from "@/components/admin/auto-print"

const STATUS_LABELS: Record<ActivityStatus, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

interface PageProps {
  searchParams: Promise<{ year?: string; semester?: string; category?: string; status?: string }>
}

export default async function PrintActivitiesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const params = await searchParams
  const where: Record<string, unknown> = {}
  if (params.year) where.targetYear = params.year
  if (params.semester) where.targetSemester = params.semester
  if (params.category) where.category = params.category as ActivityCategory
  if (params.status) where.status = params.status as ActivityStatus

  const activities = await prisma.activity.findMany({
    where,
    include: { _count: { select: { participations: true, activityCodes: true } } },
    orderBy: { createdAt: "desc" },
  })

  const printedAt = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-white font-thai">
      <AutoPrint />

      <div className="max-w-5xl mx-auto p-8 print:p-4">
        <div className="text-center mb-6 border-b-2 border-blue-800 pb-4">
          <h1 className="text-xl font-bold text-blue-900">รายการกิจกรรม</h1>
          <p className="text-sm text-gray-500 mt-1">ทั้งหมด {activities.length} กิจกรรม</p>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="px-3 py-2 text-center w-10">ลำดับ</th>
              <th className="px-3 py-2 text-left">ชื่อกิจกรรม</th>
              <th className="px-3 py-2 text-center w-24">ประเภท</th>
              <th className="px-3 py-2 text-center w-24">ปีการศึกษา</th>
              <th className="px-3 py-2 text-center w-28">ภาคเรียน</th>
              <th className="px-3 py-2 text-center w-28">วันที่จัดกิจกรรม</th>
              <th className="px-3 py-2 text-center w-24">สถานะ</th>
              <th className="px-3 py-2 text-center w-20">ผู้เข้าร่วม</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-1.5 text-center text-gray-400">{i + 1}</td>
                <td className="px-3 py-1.5">{a.name}</td>
                <td className="px-3 py-1.5 text-center text-xs text-gray-600">
                  {CATEGORY_NAMES[a.category]}
                </td>
                <td className="px-3 py-1.5 text-center text-gray-600">{a.targetYear}</td>
                <td className="px-3 py-1.5 text-center text-gray-600">{a.targetSemester}</td>
                <td className="px-3 py-1.5 text-center text-gray-600">
                  {a.startDate.toLocaleDateString("th-TH")}
                </td>
                <td className="px-3 py-1.5 text-center text-xs">{STATUS_LABELS[a.status]}</td>
                <td className="px-3 py-1.5 text-center">{a._count.participations}</td>
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
