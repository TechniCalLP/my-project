import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentEvaluations } from "@/lib/evaluation"
import { departmentVariants, resolveDepartmentVariants } from "@/lib/department"
import * as XLSX from "xlsx"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const year = searchParams.get("year")
  const academicYear = searchParams.get("academicYear")
  const semester = searchParams.get("semester")

  if (!year || !academicYear || !semester) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  let deptVariants: string[] | undefined
  if (session.user.adminRole === "TEACHER") {
    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    })
    if (!teacher?.department) {
      return NextResponse.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับแผนก" }, { status: 403 })
    }
    deptVariants = departmentVariants(teacher.department)
  } else {
    const department = searchParams.get("department") ?? undefined
    deptVariants = department ? await resolveDepartmentVariants(department) : undefined
  }

  const students = await prisma.student.findMany({
    where: { isActive: true, year, ...(deptVariants ? { department: { in: deptVariants } } : {}) },
    orderBy: [{ department: "asc" }, { group: "asc" }, { studentId: "asc" }],
  })

  const evaluations = await getStudentEvaluations(students.map((s) => s.id), academicYear, semester)

  const overallLabel = (status: string) => (status === "PASS" ? "ผ่าน" : status === "FAIL" ? "ไม่ผ่าน" : "รอดำเนินการ")

  const rows = students.map((s, i) => {
    const evaluation = evaluations.get(s.id)!
    const row: Record<string, string | number> = {
      "ลำดับ": i + 1,
      "รหัสนักศึกษา": s.studentId,
      "ชื่อ-สกุล": `${s.prefix}${s.firstName} ${s.lastName}`,
      "แผนก": s.department,
      "กลุ่ม": s.group ?? "-",
      "ชั้นปี": s.year,
      "กิจกรรมภาคบังคับ (%)": evaluation.participation.progress,
    }
    for (const a of evaluation.vocationalActivities) {
      row[a.name] = a.score != null ? a.score : "-"
    }
    row["ผลการประเมิน"] = overallLabel(evaluation.overall)
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "สรุปผลการประเมิน")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const fileName = `summary_${year}_${academicYear}_${semester}.xlsx`

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  })
}
