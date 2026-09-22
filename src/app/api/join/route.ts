import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { joinSchema } from "@/lib/validations"
import { resolveDepartmentVariants } from "@/lib/department"
import { isRateLimited, recordAttempt } from "@/lib/rate-limit"

// Codes are 6 characters (3 letters + 3 digits, ~17.5M combinations) with a
// unique constraint, so guessing one right is astronomically unlikely by hand
// — but with no limit at all, a script could brute-force one. This only
// throttles wrong-code guesses (not legitimate join attempts against a real
// code), so it doesn't get in the way of normal use.
const MAX_INVALID_CODE_ATTEMPTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studentDbId = session.user.id as string
  const rateLimitKey = `join:${studentDbId}`

  const body = await request.json()
  const parsed = joinSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  if (isRateLimited(rateLimitKey, MAX_INVALID_CODE_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
    return Response.json({ error: "ลองรหัสผิดบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" }, { status: 429 })
  }

  const { code } = parsed.data

  const activityCode = await prisma.activityCode.findFirst({
    where: { code },
    include: { activity: true },
  })

  if (!activityCode) {
    recordAttempt(rateLimitKey)
    return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 })
  }

  if (activityCode.isUsed) {
    return Response.json({ error: "รหัสนี้ถูกใช้งานแล้ว" }, { status: 400 })
  }

  if (activityCode.activity.status !== "ACTIVE") {
    return Response.json({ error: "กิจกรรมนี้ไม่ได้เปิดรับสมัคร" }, { status: 400 })
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
