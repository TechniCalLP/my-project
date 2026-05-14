import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { code } = body

  if (!code) return Response.json({ error: "กรุณากรอกรหัส" }, { status: 400 })

  const activityCode = await prisma.activityCode.findFirst({
    where: { code, activityId: id },
  })

  if (!activityCode) {
    return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 })
  }

  if (activityCode.isUsed) {
    return Response.json({ error: "รหัสนี้ถูกใช้งานแล้ว" }, { status: 400 })
  }

  const studentDbId = session.user.id as string

  const existing = await prisma.participation.findFirst({
    where: { studentId: studentDbId, activityId: id },
  })

  if (existing) {
    return Response.json({ error: "คุณได้เข้าร่วมกิจกรรมนี้แล้ว" }, { status: 400 })
  }

  const [participation] = await prisma.$transaction([
    prisma.participation.create({
      data: {
        studentId: studentDbId,
        activityId: id,
        codeUsed: activityCode.code,
      },
    }),
    prisma.activityCode.update({
      where: { id: activityCode.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedBy: studentDbId,
      },
    }),
  ])

  return Response.json(participation, { status: 201 })
}
