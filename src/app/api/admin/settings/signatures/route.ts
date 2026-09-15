import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE_BYTES = 2 * 1024 * 1024

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

    if (typeof name !== "string" || !name.trim()) {
      return Response.json({ error: "กรุณาระบุชื่อผู้ลงนาม" }, { status: 400 })
    }
    if (typeof position !== "string" || !position.trim()) {
      return Response.json({ error: "กรุณาระบุตำแหน่ง" }, { status: 400 })
    }
    if (!(file instanceof File)) {
      return Response.json({ error: "กรุณาแนบไฟล์รูปลายเซ็น" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "รองรับเฉพาะไฟล์รูปภาพ" }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const imageData = `data:${file.type};base64,${buffer.toString("base64")}`

    const isFirst = (await prisma.documentSignature.count()) === 0
    const signature = await prisma.documentSignature.create({
      data: { name: name.trim(), position: position.trim(), imageData, isActive: isFirst },
    })

    return Response.json({ signature })
  } catch (error) {
    console.error("Create signature error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
