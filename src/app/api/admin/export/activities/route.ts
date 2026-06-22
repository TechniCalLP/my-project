import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"

const STATUS_LABELS: Record<ActivityStatus, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year") || undefined
  const semester = searchParams.get("semester") || undefined
  const category = searchParams.get("category") || undefined
  const status = searchParams.get("status") || undefined

  const where: Record<string, unknown> = {}
  if (year) where.targetYear = year
  if (semester) where.targetSemester = semester
  if (category) where.category = category as ActivityCategory
  if (status) where.status = status as ActivityStatus

  const activities = await prisma.activity.findMany({
    where,
    include: {
      _count: { select: { participations: true, activityCodes: true } },
      participations: {
        include: {
          student: {
            select: { studentId: true, prefix: true, firstName: true, lastName: true, department: true, group: true, year: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const wb = XLSX.utils.book_new()

  // Sheet 1: Activity summary
  const summaryRows = activities.map((a, i) => ({
    "ลำดับ": i + 1,
    "ชื่อกิจกรรม": a.name,
    "ประเภท": CATEGORY_NAMES[a.category],
    "ปีการศึกษา": a.targetYear,
    "ภาคเรียน": a.targetSemester,
    "วันที่จัดกิจกรรม": a.startDate.toLocaleDateString("th-TH"),
    "สถานที่": a.location || "-",
    "สถานะ": STATUS_LABELS[a.status],
    "รหัสทั้งหมด": a._count.activityCodes,
    "ผู้เข้าร่วม": a._count.participations,
  }))

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  wsSummary["!cols"] = [
    { wch: 6 }, { wch: 30 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
    { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปกิจกรรม")

  // Sheet 2: Participation detail
  const detailRows: Record<string, unknown>[] = []
  activities.forEach((a) => {
    a.participations.forEach((p, i) => {
      detailRows.push({
        "ลำดับ": i + 1,
        "กิจกรรม": a.name,
        "ประเภท": CATEGORY_NAMES[a.category],
        "ปีการศึกษา": a.targetYear,
        "ภาคเรียน": a.targetSemester,
        "รหัสนักศึกษา": p.student.studentId,
        "ชื่อ-สกุล": `${p.student.prefix}${p.student.firstName} ${p.student.lastName}`,
        "แผนก": p.student.department,
        "กลุ่ม": p.student.group ?? "-",
        "ชั้นปี": p.student.year,
        "วันที่เข้าร่วม": p.joinedAt.toLocaleDateString("th-TH"),
      })
    })
  })

  const wsDetail = XLSX.utils.json_to_sheet(detailRows)
  wsDetail["!cols"] = [
    { wch: 6 }, { wch: 30 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 8 }, { wch: 8 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsDetail, "รายละเอียดผู้เข้าร่วม")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const fileName = `activities_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
