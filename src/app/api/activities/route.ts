import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { activitySchema } from "@/lib/validations"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const where: Record<string, unknown> = {}

  const year = searchParams.get("year")
  const semester = searchParams.get("semester")
  const department = searchParams.get("department")
  const category = searchParams.get("category")
  const status = searchParams.get("status")

  if (year) where.targetYear = year
  if (semester) where.targetSemester = semester
  if (category) where.category = category as ActivityCategory
  if (status) where.status = status as ActivityStatus

  const activities = await prisma.activity.findMany({
    where: { ...where, isDeleted: false },
    include: { _count: { select: { participations: true } } },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(activities)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = activitySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const data = parsed.data
  const activity = await prisma.activity.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      targetYear: data.targetYear,
      targetSemester: data.targetSemester,
      targetDepartments: data.targetDepartments,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      location: data.location || null,
      maxSlots: data.maxSlots ? Number(data.maxSlots) : null,
      status: data.status,
      adminId: session.user.id as string,
    },
  })

  return Response.json(activity, { status: 201 })
}
