import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { vocationalActivitySchema } from "@/lib/validations"

function isManagementRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "ADMIN"
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || !isManagementRole(session.user.adminRole)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = vocationalActivitySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const data = parsed.data

    const activity = await prisma.vocationalActivity.update({
      where: { id },
      data: {
        name: data.name,
        academicYear: data.academicYear,
        semester: data.semester,
        targetYears: data.targetYears,
        passThreshold: data.passThreshold,
        departments: { set: data.departmentIds.map((depId) => ({ id: depId })) },
      },
    })

    return Response.json(activity)
  } catch (error) {
    console.error("Update vocational activity error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || !isManagementRole(session.user.adminRole)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.vocationalActivity.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete vocational activity error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
