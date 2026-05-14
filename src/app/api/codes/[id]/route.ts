import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const code = await prisma.activityCode.findUnique({ where: { id } })
  if (!code) return Response.json({ error: "Code not found" }, { status: 404 })
  if (code.isUsed) return Response.json({ error: "Cannot delete used code" }, { status: 400 })

  await prisma.activityCode.delete({ where: { id } })
  return Response.json({ success: true })
}
