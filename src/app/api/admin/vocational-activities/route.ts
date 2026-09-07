import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { vocationalActivitySchema } from "@/lib/validations"

function isManagementRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN"
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || !isManagementRole(session.user.adminRole)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const academicYear = searchParams.get("academicYear")

  const where: Record<string, unknown> = {}
  if (search) where.name = { contains: search, mode: "insensitive" }
  if (academicYear) where.academicYear = academicYear

  const activities = await prisma.vocationalActivity.findMany({
    where,
    include: { departments: true, _count: { select: { scores: true } } },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(activities)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || !isManagementRole(session.user.adminRole)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = vocationalActivitySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const data = parsed.data

    const activity = await prisma.vocationalActivity.create({
      data: {
        name: data.name,
        academicYear: data.academicYear,
        semester: data.semester,
        targetYears: data.targetYears,
        passThreshold: data.passThreshold,
        departments: { connect: data.departmentIds.map((id) => ({ id })) },
      },
    })

    return Response.json(activity)
  } catch (error) {
    console.error("Create vocational activity error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
