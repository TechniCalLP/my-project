import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scoreCorrectionRequestSchema } from "@/lib/validations"
import { clubDepartmentVariants } from "@/lib/club"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = scoreCorrectionRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const { activityId, studentId, proposedScore, reason } = parsed.data

    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { club: { include: { departments: true } } },
    })
    if (!teacher?.club) {
      return Response.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับชมรม" }, { status: 403 })
    }

    const activity = await prisma.vocationalActivity.findUnique({
      where: { id: activityId },
      include: { clubs: true },
    })
    if (!activity) return Response.json({ error: "ไม่พบกิจกรรม" }, { status: 404 })
    if (!activity.clubs.some((c) => c.id === teacher.clubId)) {
      return Response.json({ error: "กิจกรรมนี้ไม่ได้กำหนดให้ชมรมของท่าน" }, { status: 403 })
    }

    const student = await prisma.student.findFirst({
      where: { id: studentId, department: { in: clubDepartmentVariants(teacher.club) } },
    })
    if (!student) return Response.json({ error: "ไม่พบนักศึกษาในชมรมของท่าน" }, { status: 403 })

    const existingScore = await prisma.vocationalActivityScore.findUnique({
      where: { vocationalActivityId_studentId: { vocationalActivityId: activityId, studentId } },
    })
    if (!existingScore || existingScore.isDraft) {
      return Response.json({ error: "คะแนนนี้ยังไม่ได้บันทึกฉบับสมบูรณ์ แก้ไขได้โดยตรง ไม่ต้องส่งคำขอ" }, { status: 400 })
    }

    const request = await prisma.vocationalScoreCorrectionRequest.create({
      data: {
        vocationalActivityId: activityId,
        studentId,
        currentScore: existingScore.score,
        proposedScore,
        reason,
        requestedById: session.user.id,
      },
    })

    return Response.json(request, { status: 201 })
  } catch (error) {
    console.error("Create score correction request error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
