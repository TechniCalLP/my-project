import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
  }

  if (newPassword.length < 4) {
    return Response.json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" }, { status: 400 })
  }

  const studentDbId = session.user.id as string

  const student = await prisma.student.findUnique({ where: { id: studentDbId } })
  if (!student) return Response.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 })

  const isValid = await bcrypt.compare(currentPassword, student.password)
  if (!isValid) {
    return Response.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)

  await prisma.student.update({
    where: { id: studentDbId },
    data: {
      password: hashed,
      isFirstLogin: false,
    },
  })

  return Response.json({ success: true })
}
