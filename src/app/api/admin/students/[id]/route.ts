import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await req.json()

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(data.prefix !== undefined && { prefix: data.prefix }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return Response.json(student)
  } catch (error) {
    console.error("Update student error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.student.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete student error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
