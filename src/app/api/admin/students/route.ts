import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const search = req.nextUrl.searchParams.get("search")?.trim() ?? ""
  if (search.length < 2) return Response.json([])

  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      OR: [
        { studentId: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ],
    },
    select: { id: true, studentId: true, prefix: true, firstName: true, lastName: true, year: true, department: true },
    orderBy: { studentId: "asc" },
    take: 20,
  })

  return Response.json(students)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const existing = await prisma.student.findUnique({
      where: { studentId: data.studentId },
    })

    if (existing) {
      return Response.json({ error: "รหัสนักศึกษานี้มีอยู่แล้ว" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.studentId, 10)

    const student = await prisma.student.create({
      data: {
        studentId: data.studentId,
        prefix: data.prefix,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        department: data.department,
        year: data.year,
        group: data.group || null,
        password: hashedPassword,
        isActive: true,
        isFirstLogin: true,
      },
    })

    return Response.json(student)
  } catch (error) {
    console.error("Create student error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
