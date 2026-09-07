import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const newPassword = typeof body.password === "string" ? body.password : null

    if (!newPassword || newPassword.length < 4) {
      return Response.json({ error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร" }, { status: 400 })
    }

    const account = await prisma.admin.findUnique({ where: { id } })
    if (!account) {
      return Response.json({ error: "Account not found" }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.admin.update({ where: { id }, data: { password: hashedPassword } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Reset account password error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
