import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(student.studentId, 10)

    await prisma.student.update({
      where: { id },
      data: { password: hashedPassword, isFirstLogin: true },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
