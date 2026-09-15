import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COLLEGE_LOGO_KEY, getCollegeLogo } from "@/lib/settings"

const MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"]

export async function GET() {
  // Public read: the logo is already visible unauthenticated on the login
  // pages, and the student layout needs it too, so no session is required.
  const logo = await getCollegeLogo()
  return Response.json({ logo })
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
      return Response.json({ error: "กรุณาแนบไฟล์โลโก้" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "รองรับเฉพาะไฟล์ PNG, JPG หรือ SVG" }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 2MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`

    await prisma.systemSetting.upsert({
      where: { key: COLLEGE_LOGO_KEY },
      update: { value: dataUrl },
      create: { key: COLLEGE_LOGO_KEY, value: dataUrl },
    })

    return Response.json({ logo: dataUrl })
  } catch (error) {
    console.error("Upload college logo error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.systemSetting.deleteMany({ where: { key: COLLEGE_LOGO_KEY } })
  return Response.json({ success: true })
}
