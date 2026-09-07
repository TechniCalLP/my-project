import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { adminAccountUpdateSchema } from "@/lib/validations"

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
    const parsed = adminAccountUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const data = parsed.data

    const account = await prisma.admin.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.role !== undefined && {
          departmentId: data.role === "TEACHER" ? data.departmentId : null,
        }),
      },
    })

    return Response.json(account)
  } catch (error) {
    console.error("Update account error:", error)
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

    if (id === session.user.id) {
      return Response.json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" }, { status: 400 })
    }

    await prisma.admin.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete account error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
