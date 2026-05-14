import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get("year")
  const department = searchParams.get("department")
  const search = searchParams.get("search")

  const where: Record<string, unknown> = {}
  if (year) where.year = year
  if (department) where.department = department
  if (search) {
    where.OR = [
      { studentId: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }

  const students = await prisma.student.findMany({
    where,
    include: { _count: { select: { participations: true } } },
    orderBy: { studentId: "asc" },
  })

  return Response.json(students)
}
