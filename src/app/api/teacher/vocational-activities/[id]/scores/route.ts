import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { bulkVocationalScoreSchema } from "@/lib/validations"
import { departmentVariants } from "@/lib/department"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = bulkVocationalScoreSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const { scores } = parsed.data

    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    })
    if (!teacher?.department) {
      return Response.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับแผนก" }, { status: 403 })
    }

    const activity = await prisma.vocationalActivity.findUnique({
      where: { id },
      include: { departments: true },
    })
    if (!activity) {
      return Response.json({ error: "ไม่พบกิจกรรม" }, { status: 404 })
    }
    if (!activity.departments.some((d) => d.id === teacher.departmentId)) {
      return Response.json({ error: "กิจกรรมนี้ไม่ได้กำหนดให้แผนกของท่าน" }, { status: 403 })
    }

    const studentIds = [...new Set(scores.map((s) => s.studentId))]
    const validStudents = await prisma.student.findMany({
      where: { id: { in: studentIds }, department: { in: departmentVariants(teacher.department) } },
      select: { id: true },
    })
    if (validStudents.length !== studentIds.length) {
      return Response.json({ error: "พบนักศึกษาที่ไม่อยู่ในแผนกของท่าน" }, { status: 403 })
    }

    await prisma.$transaction(
      scores.map((s) =>
        prisma.vocationalActivityScore.upsert({
          where: { vocationalActivityId_studentId: { vocationalActivityId: id, studentId: s.studentId } },
          create: { vocationalActivityId: id, studentId: s.studentId, score: s.score, enteredById: session.user.id },
          update: { score: s.score, enteredById: session.user.id },
        })
      )
    )

    return Response.json({ success: true, count: scores.length })
  } catch (error) {
    console.error("Save vocational activity scores error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
