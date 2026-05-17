import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const student = await prisma.student.findUnique({
    where: { id: session.user.id },
    select: {
      studentId: true,
      prefix: true,
      firstName: true,
      lastName: true,
      department: true,
      year: true,
      participations: {
        include: {
          activity: {
            select: {
              name: true,
              category: true,
              targetYear: true,
              targetSemester: true,
              startDate: true,
              location: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  })

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(student)
}
