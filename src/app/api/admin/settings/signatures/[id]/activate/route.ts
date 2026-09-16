import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.documentSignature.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: "ไม่พบรายการลายเซ็น" }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.documentSignature.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.documentSignature.update({ where: { id }, data: { isActive: true } }),
  ])

  return Response.json({ success: true })
}
