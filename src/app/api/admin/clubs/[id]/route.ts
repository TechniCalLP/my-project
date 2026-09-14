import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clubSchema } from "@/lib/validations"

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
    const parsed = clubSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }

    const conflict = await prisma.club.findFirst({ where: { id: { not: id }, name: parsed.data.name } })
    if (conflict) {
      return Response.json({ error: "มีชมรมชื่อนี้อยู่แล้ว" }, { status: 400 })
    }

    const club = await prisma.club.update({
      where: { id },
      data: {
        name: parsed.data.name,
        departments: { set: parsed.data.departmentIds.map((depId) => ({ id: depId })) },
      },
    })

    return Response.json(club)
  } catch (error) {
    console.error("Update club error:", error)
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

    await prisma.club.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete club error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
