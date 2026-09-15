import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clubSchema } from "@/lib/validations"

function isManagementRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN"
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || !isManagementRole(session.user.adminRole)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const clubs = await prisma.club.findMany({
    include: { departments: true, _count: { select: { admins: true, activities: true } } },
    orderBy: { name: "asc" },
  })
  return Response.json(clubs)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || !isManagementRole(session.user.adminRole)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = clubSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }

    const existing = await prisma.club.findUnique({ where: { name: parsed.data.name } })
    if (existing) {
      return Response.json({ error: "มีชมรมนี้อยู่แล้ว" }, { status: 400 })
    }

    const club = await prisma.club.create({
      data: {
        name: parsed.data.name,
        departments: { connect: parsed.data.departmentIds.map((id) => ({ id })) },
      },
    })
    return Response.json(club)
  } catch (error) {
    console.error("Create club error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
