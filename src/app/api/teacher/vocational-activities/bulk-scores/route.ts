import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { gradeBulkScoreSchema } from "@/lib/validations"
import { clubDepartmentVariants } from "@/lib/club"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = gradeBulkScoreSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const { entries, isDraft } = parsed.data

    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { club: { include: { departments: true } } },
    })
    if (!teacher?.club) {
      return Response.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับชมรม" }, { status: 403 })
    }

    const activityIds = [...new Set(entries.map((e) => e.activityId))]
    const studentIds = [...new Set(entries.map((e) => e.studentId))]

    const [activities, students] = await Promise.all([
      prisma.vocationalActivity.findMany({
        where: { id: { in: activityIds } },
        include: { clubs: true },
      }),
      prisma.student.findMany({
        where: { id: { in: studentIds }, department: { in: clubDepartmentVariants(teacher.club) } },
        select: { id: true },
      }),
    ])

    if (activities.length !== activityIds.length) {
      return Response.json({ error: "ไม่พบกิจกรรมบางรายการ" }, { status: 404 })
    }
    const unauthorizedActivity = activities.some((a) => !a.clubs.some((c) => c.id === teacher.clubId))
    if (unauthorizedActivity) {
      return Response.json({ error: "พบกิจกรรมที่ไม่ได้กำหนดให้ชมรมของท่าน" }, { status: 403 })
    }
    if (students.length !== studentIds.length) {
      return Response.json({ error: "พบนักศึกษาที่ไม่อยู่ในแผนกของท่าน" }, { status: 403 })
    }

    await prisma.$transaction(
      entries.map((e) =>
        prisma.vocationalActivityScore.upsert({
          where: { vocationalActivityId_studentId: { vocationalActivityId: e.activityId, studentId: e.studentId } },
          create: {
            vocationalActivityId: e.activityId,
            studentId: e.studentId,
            score: e.score,
            isDraft,
            enteredById: session.user.id,
          },
          update: { score: e.score, isDraft, enteredById: session.user.id },
        })
      )
    )

    return Response.json({ success: true, count: entries.length })
  } catch (error) {
    console.error("Save grade bulk scores error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
