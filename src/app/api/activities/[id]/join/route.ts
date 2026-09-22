import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveDepartmentVariants } from "@/lib/department"
import { isRateLimited, recordAttempt } from "@/lib/rate-limit"

const MAX_INVALID_CODE_ATTEMPTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studentDbId = session.user.id as string
  const rateLimitKey = `join:${studentDbId}`

  const { id } = await params
  const body = await request.json()
  const { code } = body

  if (!code) return Response.json({ error: "กรุณากรอกรหัส" }, { status: 400 })

  if (isRateLimited(rateLimitKey, MAX_INVALID_CODE_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
    return Response.json({ error: "ลองรหัสผิดบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" }, { status: 429 })
  }

  const activityCode = await prisma.activityCode.findFirst({
    where: { code, activityId: id },
    include: { activity: true },
  })

  if (!activityCode) {
    recordAttempt(rateLimitKey)
    return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 })
  }

  if (activityCode.isUsed) {
    return Response.json({ error: "รหัสนี้ถูกใช้งานแล้ว" }, { status: 400 })
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentDbId },
    select: { year: true, department: true },
  })

  if (student.year !== activityCode.activity.targetYear) {
    return Response.json({ error: "รหัสนี้ไม่ได้สำหรับชั้นปีของคุณ" }, { status: 400 })
  }

  if (activityCode.activity.targetDepartments.length > 0) {
    const departmentVariants = await resolveDepartmentVariants(student.department)
    const eligible = activityCode.activity.targetDepartments.some((d) => departmentVariants.includes(d))
    if (!eligible) {
      return Response.json({ error: "รหัสนี้ไม่ได้สำหรับแผนกของคุณ" }, { status: 400 })
    }
  }

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
