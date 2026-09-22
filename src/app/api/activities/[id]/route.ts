import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { activitySchema } from "@/lib/validations"
import { resolveDepartmentVariants } from "@/lib/department"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const isAdmin = session.user.role === "admin"

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      participations: {
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              year: true,
              department: true,
            },
          },
          addedBy: { select: { name: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      ...(isAdmin ? { activityCodes: { orderBy: { createdAt: "desc" } } } : {}),
    },
  })

  if (!activity) return Response.json({ error: "Not found" }, { status: 404 })

  // Resolve every target department to its full alias set (e.g. "ไฟฟ้า" / "ช่างไฟฟ้า"
  // are the same real department across cohort years), so the client can flag a
  // participant whose year/department doesn't actually match this activity without
  // false-positiving on department name variants.
  let allowedDepartmentVariants: string[] | null = null
  if (activity.targetDepartments.length > 0) {
    const variantSets = await Promise.all(activity.targetDepartments.map((d) => resolveDepartmentVariants(d)))
    allowedDepartmentVariants = [...new Set(variantSets.flat())]
  }

  return Response.json({ ...activity, allowedDepartmentVariants })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = activitySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const data = parsed.data
  const activity = await prisma.activity.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      type: data.type,
      targetYear: data.targetYear,
      targetSemester: data.targetSemester,
      targetDepartments: data.targetDepartments,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      location: data.location || null,
      maxSlots: data.maxSlots ? Number(data.maxSlots) : null,
      status: data.status,
    },
  })

  return Response.json(activity)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await prisma.activity.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  })
  return Response.json({ success: true })
}
