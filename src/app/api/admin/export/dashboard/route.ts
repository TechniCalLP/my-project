import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"
import { CATEGORY_NAMES } from "@/lib/constants"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [students, activities, participations] = await Promise.all([
    prisma.student.findMany({
      select: { department: true, year: true, isActive: true },
    }),
    prisma.activity.findMany({
      include: { _count: { select: { participations: true } } },
    }),
    prisma.participation.findMany({
      include: {
        student: { select: { department: true, year: true } },
        activity: { select: { category: true } },
      },
    }),
  ])

  const wb = XLSX.utils.book_new()

  // Sheet 1: Overview
  const overviewRows = [
    { "หัวข้อ": "นักศึกษาทั้งหมด", "จำนวน": students.length },
    { "หัวข้อ": "นักศึกษาที่ใช้งาน", "จำนวน": students.filter(s => s.isActive).length },
    { "หัวข้อ": "กิจกรรมทั้งหมด", "จำนวน": activities.length },
    { "หัวข้อ": "การเข้าร่วมทั้งหมด", "จำนวน": participations.length },
    { "หัวข้อ": "วันที่ Export", "จำนวน": new Date().toLocaleDateString("th-TH") },
  ]
  const wsOverview = XLSX.utils.json_to_sheet(overviewRows)
  wsOverview["!cols"] = [{ wch: 24 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsOverview, "ภาพรวม")

  // Sheet 2: Students by department
  const byDept: Record<string, number> = {}
  students.forEach(s => { byDept[s.department] = (byDept[s.department] || 0) + 1 })
  const deptRows = Object.entries(byDept)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, count]) => ({ "แผนก": dept, "จำนวนนักศึกษา": count }))
  const wsDept = XLSX.utils.json_to_sheet(deptRows)
  wsDept["!cols"] = [{ wch: 28 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsDept, "นักศึกษาแยกแผนก")

  // Sheet 3: Activities by category
  const byCat: Record<string, { total: number; participants: number }> = {}
  activities.forEach(a => {
    const name = CATEGORY_NAMES[a.category]
    if (!byCat[name]) byCat[name] = { total: 0, participants: 0 }
    byCat[name].total++
    byCat[name].participants += a._count.participations
  })
  const catRows = Object.entries(byCat).map(([cat, data]) => ({
    "ประเภทกิจกรรม": cat,
    "จำนวนกิจกรรม": data.total,
    "ผู้เข้าร่วมรวม": data.participants,
  }))
  const wsCat = XLSX.utils.json_to_sheet(catRows)
  wsCat["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsCat, "กิจกรรมแยกประเภท")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const fileName = `dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  })
}
