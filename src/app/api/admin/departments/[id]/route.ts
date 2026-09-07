import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { departmentSchema } from "@/lib/validations"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = departmentSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }

    if (parsed.data.aliases.length > 0) {
      const conflict = await prisma.department.findFirst({
        where: {
          id: { not: id },
          OR: [{ name: { in: parsed.data.aliases } }, { aliases: { hasSome: parsed.data.aliases } }],
        },
      })
      if (conflict) {
        return Response.json({ error: `ชื่อเรียกอื่นซ้ำกับแผนก "${conflict.name}" ที่มีอยู่แล้ว` }, { status: 400 })
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name: parsed.data.name, aliases: parsed.data.aliases },
    })

    return Response.json(department)
  } catch (error) {
    console.error("Update department error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.department.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete department error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
