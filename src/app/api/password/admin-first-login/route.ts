import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!session.user.isFirstLogin) {
    return Response.json({ error: "ไม่อนุญาต" }, { status: 403 })
  }

  const body = await request.json()
  const { newPassword } = body

  if (!newPassword || newPassword.length < 8) {
    return Response.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 })
  }

  const admin = await prisma.admin.findUnique({ where: { id: session.user.id } })
  if (!admin) return Response.json({ error: "ไม่พบข้อมูลบัญชี" }, { status: 404 })

  const isSameAsUsername = newPassword === admin.username
  if (isSameAsUsername) {
    return Response.json({ error: "รหัสผ่านใหม่ต้องไม่เหมือนชื่อผู้ใช้" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.admin.update({
    where: { id: session.user.id },
    data: { password: hashed, isFirstLogin: false },
  })

  return Response.json({ success: true })
}
