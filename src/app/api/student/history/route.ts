import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ActivityCategory } from "@/generated/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year")
  const semester = searchParams.get("semester")
  const category = searchParams.get("category")

  const activityWhere: Record<string, unknown> = {}
  if (year) activityWhere.targetYear = year
  if (semester) activityWhere.targetSemester = semester
  if (category) activityWhere.category = category as ActivityCategory

  const participations = await prisma.participation.findMany({
    where: {
      studentId: session.user.id,
      ...(Object.keys(activityWhere).length > 0 ? { activity: activityWhere } : {}),
    },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          category: true,
          targetYear: true,
          targetSemester: true,
          location: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  return Response.json(participations)
}
