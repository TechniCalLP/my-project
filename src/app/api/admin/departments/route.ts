import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { departmentSchema } from "@/lib/validations"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } })
  return Response.json(departments)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = departmentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }

    const existing = await prisma.department.findUnique({ where: { name: parsed.data.name } })
    if (existing) {
      return Response.json({ error: "มีแผนกนี้อยู่แล้ว" }, { status: 400 })
    }

    if (parsed.data.aliases.length > 0) {
      const conflict = await prisma.department.findFirst({
        where: { OR: [{ name: { in: parsed.data.aliases } }, { aliases: { hasSome: parsed.data.aliases } }] },
      })
      if (conflict) {
        return Response.json({ error: `ชื่อเรียกอื่นซ้ำกับแผนก "${conflict.name}" ที่มีอยู่แล้ว` }, { status: 400 })
      }
    }

    const department = await prisma.department.create({
      data: { name: parsed.data.name, aliases: parsed.data.aliases },
    })
    return Response.json(department)
  } catch (error) {
    console.error("Create department error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
