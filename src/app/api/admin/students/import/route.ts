import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

interface StudentImport {
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  department: string
  year: string
  email?: string
  phone?: string
  status: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { students } = await req.json()

    if (!Array.isArray(students) || students.length === 0) {
      return Response.json({ error: "Invalid data" }, { status: 400 })
    }

    const results: (StudentImport & { error?: string })[] = []
    let successCount = 0
    let failedCount = 0

    for (const student of students as StudentImport[]) {
      const base = { ...student }

      if (!student.studentId || !student.prefix || !student.firstName || !student.lastName || !student.department || !student.year) {
        results.push({ ...base, status: "error", error: "ข้อมูลไม่ครบ" })
        failedCount++
        continue
      }

      try {
        const existing = await prisma.student.findUnique({
          where: { studentId: student.studentId },
        })

        if (existing) {
          results.push({ ...base, status: "error", error: "รหัสนักศึกษาซ้ำ" })
          failedCount++
          continue
        }

        const hashedPassword = await bcrypt.hash(student.studentId, 10)

        await prisma.student.create({
          data: {
            studentId: student.studentId,
            prefix: student.prefix,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email || null,
            phone: student.phone || null,
            department: student.department,
            year: student.year,
            password: hashedPassword,
            isActive: true,
            isFirstLogin: true,
          },
        })

        results.push({ ...base, status: "success" })
        successCount++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด"
        results.push({ ...base, status: "error", error: msg })
        failedCount++
      }
    }

    return Response.json({
      success: successCount,
      failed: failedCount,
      total: students.length,
      results,
    })
  } catch (error) {
    console.error("Import students error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
