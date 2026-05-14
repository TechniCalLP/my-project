import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { codeGenerateSchema } from "@/lib/validations"

function generateRandomCode(): string {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("")
  const digits = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `${letters}${digits}`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const codes = await prisma.activityCode.findMany({
    where: { activityId: id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(codes)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const activity = await prisma.activity.findUnique({ where: { id } })
  if (!activity) return Response.json({ error: "Activity not found" }, { status: 404 })

  const body = await request.json()
  const parsed = codeGenerateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { count } = parsed.data

  const generatedCodes: string[] = []
  for (let i = 0; i < count; i++) {
    let attempts = 0
    while (attempts < 100) {
      const code = generateRandomCode()
      const exists = await prisma.activityCode.findUnique({ where: { code } })
      if (!exists && !generatedCodes.includes(code)) {
        generatedCodes.push(code)
        break
      }
      attempts++
    }
    if (generatedCodes.length <= i) {
      return Response.json({ error: "Unable to generate unique codes" }, { status: 500 })
    }
  }

  await prisma.activityCode.createMany({
    data: generatedCodes.map((code) => ({ code, activityId: id })),
  })

  const codes = await prisma.activityCode.findMany({
    where: { activityId: id, code: { in: generatedCodes } },
    orderBy: { code: "asc" },
  })

  return Response.json(codes, { status: 201 })
}
