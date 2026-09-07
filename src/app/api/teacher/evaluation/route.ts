import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { departmentVariants } from "@/lib/department"

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const year = searchParams.get("year")
    const academicYear = searchParams.get("academicYear")
    const semester = searchParams.get("semester")
    const search = searchParams.get("search")?.trim() ?? ""
    const status = searchParams.get("status") ?? "all"
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))

    if (!year || !academicYear || !semester) {
      return Response.json({ error: "Missing parameters" }, { status: 400 })
    }

    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    })
    if (!teacher?.department) {
      return Response.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับแผนก" }, { status: 403 })
    }

    const activities = await prisma.vocationalActivity.findMany({
      where: {
        academicYear,
        semester,
        departments: { some: { id: teacher.departmentId! } },
        OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: year } }],
      },
      orderBy: { name: "asc" },
    })

    if (activities.length === 0) {
      return Response.json({ activities: [], rows: [], total: 0, page: 1, totalPages: 0 })
    }

    const activityIds = activities.map((a) => a.id)

    const baseWhere = {
      department: { in: departmentVariants(teacher.department) },
      isActive: true,
      year,
      ...(search
        ? {
            OR: [
              { studentId: { contains: search } },
              { firstName: { contains: search } },
              { lastName: { contains: search } },
            ],
          }
        : {}),
    }

    let studentIds: string[] | null = null

    if (status === "filled" || status === "unfilled") {
      const candidates = await prisma.student.findMany({ where: baseWhere, select: { id: true } })
      const candidateIds = candidates.map((c) => c.id)
      const counts = await prisma.vocationalActivityScore.groupBy({
        by: ["studentId"],
        where: { vocationalActivityId: { in: activityIds }, studentId: { in: candidateIds }, isDraft: false },
        _count: { vocationalActivityId: true },
      })
      const filledSet = new Set(
        counts.filter((c) => c._count.vocationalActivityId === activities.length).map((c) => c.studentId)
      )
      studentIds =
        status === "filled" ? candidateIds.filter((id) => filledSet.has(id)) : candidateIds.filter((id) => !filledSet.has(id))
    }

    const where = studentIds ? { ...baseWhere, id: { in: studentIds } } : baseWhere

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        orderBy: [{ group: "asc" }, { studentId: "asc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ])

    const scores = await prisma.vocationalActivityScore.findMany({
      where: { vocationalActivityId: { in: activityIds }, studentId: { in: students.map((s) => s.id) } },
    })
    const scoreByStudentActivity = new Map<string, Map<string, { score: number; isDraft: boolean }>>()
    for (const s of scores) {
      if (!scoreByStudentActivity.has(s.studentId)) scoreByStudentActivity.set(s.studentId, new Map())
      scoreByStudentActivity.get(s.studentId)!.set(s.vocationalActivityId, { score: s.score, isDraft: s.isDraft })
    }

    const rows = students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      prefix: s.prefix,
      firstName: s.firstName,
      lastName: s.lastName,
      group: s.group,
      scores: Object.fromEntries(
        activities.map((a) => [
          a.id,
          scoreByStudentActivity.get(s.id)?.get(a.id) ?? { score: null, isDraft: false },
        ])
      ),
    }))

    return Response.json({
      activities: activities.map((a) => ({ id: a.id, name: a.name, passThreshold: a.passThreshold })),
      rows,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    })
  } catch (error) {
    console.error("Fetch teacher evaluation data error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
