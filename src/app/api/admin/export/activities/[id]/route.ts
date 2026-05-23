import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { CATEGORY_NAMES } from "@/lib/constants"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const wb = XLSX.utils.book_new()

  // Sheet 1: Activity info
  const infoRows = [
    { "หัวข้อ": "ชื่อกิจกรรม", "ข้อมูล": activity.name },
    { "หัวข้อ": "ประเภท", "ข้อมูล": CATEGORY_NAMES[activity.category] },
    { "หัวข้อ": "สถานะ", "ข้อมูล": STATUS_LABELS[activity.status] },
    { "หัวข้อ": "ปีการศึกษา", "ข้อมูล": activity.targetYear },
    { "หัวข้อ": "ภาคเรียน", "ข้อมูล": activity.targetSemester },
    { "หัวข้อ": "วันที่จัดกิจกรรม", "ข้อมูล": activity.startDate.toLocaleDateString("th-TH") },
    { "หัวข้อ": "สถานที่", "ข้อมูล": activity.location || "-" },
    { "หัวข้อ": "จำนวนผู้เข้าร่วม", "ข้อมูล": activity.participations.length },
  ]
  const wsInfo = XLSX.utils.json_to_sheet(infoRows)
  wsInfo["!cols"] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsInfo, "ข้อมูลกิจกรรม")

  // Sheet 2: Participant list
  const participantRows = activity.participations.map((p) => ({
    "รหัสนักศึกษา": p.student.studentId,
    "ชื่อ": p.student.firstName,
    "นามสกุล": p.student.lastName,
    "แผนก": p.student.department,
    "ชั้นปี": p.student.year,
  }))

  const wsParticipants = XLSX.utils.json_to_sheet(
    participantRows.length > 0 ? participantRows : [{ "หมายเหตุ": "ยังไม่มีผู้เข้าร่วม" }]
  )
  wsParticipants["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 26 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsParticipants, "รายชื่อผู้เข้าร่วม")



  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const safeName = activity.name.replace(/[^฀-๿a-zA-Z0-9]/g, "_").slice(0, 40)
  const fileName = `activity_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
