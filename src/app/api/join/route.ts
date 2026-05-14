import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { joinSchema } from "@/lib/validations"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { code } = parsed.data

  const activityCode = await prisma.activityCode.findFirst({
    where: { code },
    include: { activity: true },
  })

  if (!activityCode) {
    return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 })
  }

  if (activityCode.isUsed) {
    return Response.json({ error: "รหัสนี้ถูกใช้งานแล้ว" }, { status: 400 })
  }

  if (activityCode.activity.status !== "ACTIVE") {
    return Response.json({ error: "กิจกรรมนี้ไม่ได้เปิดรับสมัคร" }, { status: 400 })
  }

  const studentDbId = session.user.id as string

  const existing = await prisma.participation.findFirst({
    where: { studentId: studentDbId, activityId: activityCode.activityId },
  })

  if (existing) {
    return Response.json({ error: "คุณได้เข้าร่วมกิจกรรมนี้แล้ว" }, { status: 400 })
  }

  const [participation] = await prisma.$transaction([
    prisma.participation.create({
      data: {
        studentId: studentDbId,
        activityId: activityCode.activityId,
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

  return Response.json({
    participation,
    activity: {
      id: activityCode.activity.id,
      name: activityCode.activity.name,
      category: activityCode.activity.category,
    },
  }, { status: 201 })
}
