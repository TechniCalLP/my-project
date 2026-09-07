import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { adminAccountSchema } from "@/lib/validations"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await prisma.admin.findMany({
    include: { department: true },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(accounts)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = adminAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const data = parsed.data

    if (!data.password) {
      return Response.json({ error: "กรุณากรอกรหัสผ่าน" }, { status: 400 })
    }

    const existing = await prisma.admin.findUnique({ where: { username: data.username } })
    if (existing) {
      return Response.json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const account = await prisma.admin.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        departmentId: data.role === "TEACHER" ? data.departmentId : null,
      },
    })

    return Response.json(account)
  } catch (error) {
    console.error("Create account error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
