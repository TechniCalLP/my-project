import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ["image/png", "image/svg+xml"]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
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
    if (!(file instanceof File)) {
      return Response.json({ error: "กรุณาแนบไฟล์ลายเซ็น" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "รองรับเฉพาะไฟล์ PNG หรือ SVG" }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const imageData = `data:${file.type};base64,${buffer.toString("base64")}`

    const signature = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.documentSignature.updateMany({ where: { isActive: true }, data: { isActive: false } })
      }
      return tx.documentSignature.create({
        data: { name: name.trim(), position: position.trim(), imageData, isActive },
      })
    })

    return Response.json({ signature })
  } catch (error) {
    console.error("Create signature error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
