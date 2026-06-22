import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year") || undefined
  const department = searchParams.get("department") || undefined
  const status = searchParams.get("status") || undefined

  const where: Record<string, unknown> = {}
  if (year) where.year = year
  if (department) where.department = department
  if (status) where.isActive = status === "active"

  const students = await prisma.student.findMany({
    where,
    include: { _count: { select: { participations: true } } },
    orderBy: [{ year: "asc" }, { department: "asc" }, { studentId: "asc" }],
  })

  const rows = students.map((s, i) => ({
    "ลำดับ": i + 1,
    "รหัสนักศึกษา": s.studentId,
    "คำนำหน้า": s.prefix,
    "ชื่อ": s.firstName,
    "นามสกุล": s.lastName,
    "แผนก": s.department,
    "กลุ่ม": s.group ?? "-",
    "ชั้นปี": s.year,
    "สถานะ": s.isActive ? "ใช้งาน" : "ปิดใช้งาน",
    "กิจกรรมที่เข้าร่วม": s._count.participations,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws["!cols"] = [
    { wch: 6 }, { wch: 14 }, { wch: 8 }, { wch: 16 }, { wch: 20 },
    { wch: 24 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 16 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "รายชื่อนักศึกษา")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const fileName = `students_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
