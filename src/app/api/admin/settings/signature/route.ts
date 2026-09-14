import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEPUTY_DIRECTOR_SIGNATURE_KEY, getDeputyDirectorSignature } from "@/lib/settings"

const MAX_SIZE_BYTES = 2 * 1024 * 1024

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const signature = await getDeputyDirectorSignature()
  return Response.json({ signature })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "กรุณาแนบไฟล์รูปภาพ" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "รองรับเฉพาะไฟล์รูปภาพ" }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`

    await prisma.systemSetting.upsert({
      where: { key: DEPUTY_DIRECTOR_SIGNATURE_KEY },
      update: { value: dataUrl },
      create: { key: DEPUTY_DIRECTOR_SIGNATURE_KEY, value: dataUrl },
    })

    return Response.json({ signature: dataUrl })
  } catch (error) {
    console.error("Upload signature error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.systemSetting.deleteMany({ where: { key: DEPUTY_DIRECTOR_SIGNATURE_KEY } })
  return Response.json({ success: true })
}
