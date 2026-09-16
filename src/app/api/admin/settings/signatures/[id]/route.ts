import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE_BYTES = 500 * 1024
const ALLOWED_TYPES = ["image/png", "image/svg+xml"]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.documentSignature.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: "ไม่พบรายการลายเซ็น" }, { status: 404 })
    }

    const formData = await req.formData()
    const name = formData.get("name")
    const position = formData.get("position")
    const file = formData.get("file")
    const isActive = formData.get("isActive") === "true"

    if (typeof name !== "string" || !name.trim()) {
      return Response.json({ error: "กรุณาระบุชื่อเอกสาร" }, { status: 400 })
    }
    if (typeof position !== "string" || !position.trim()) {
      return Response.json({ error: "กรุณาระบุรายละเอียด" }, { status: 400 })
    }

    let imageData = existing.imageData
    if (file instanceof File) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return Response.json({ error: "รองรับเฉพาะไฟล์ PNG หรือ SVG" }, { status: 400 })
      }
      if (file.size > MAX_SIZE_BYTES) {
        return Response.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 500KB" }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      imageData = `data:${file.type};base64,${buffer.toString("base64")}`
    }

    const signature = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.documentSignature.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } })
      }
      return tx.documentSignature.update({
        where: { id },
        data: { name: name.trim(), position: position.trim(), imageData, isActive },
      })
    })

    return Response.json({ signature })
  } catch (error) {
    console.error("Update signature error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await prisma.documentSignature.delete({ where: { id } }).catch(() => null)
  return Response.json({ success: true })
}
