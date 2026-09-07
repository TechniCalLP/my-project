import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentEvaluations } from "@/lib/evaluation"
import { departmentVariants, resolveDepartmentVariants } from "@/lib/department"

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
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

    let deptVariants: string[] | undefined
    if (session.user.adminRole === "TEACHER") {
      const teacher = await prisma.admin.findUnique({
        where: { id: session.user.id },
        include: { department: true },
      })
      if (!teacher?.department) {
        return Response.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับแผนก" }, { status: 403 })
      }
      deptVariants = departmentVariants(teacher.department)
    } else {
      const department = searchParams.get("department") ?? undefined
      deptVariants = department ? await resolveDepartmentVariants(department) : undefined
    }

    const where = {
      isActive: true,
      year,
      ...(deptVariants ? { department: { in: deptVariants } } : {}),
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

    const candidates = await prisma.student.findMany({ where, select: { id: true } })
    const evaluations = await getStudentEvaluations(candidates.map((c) => c.id), academicYear, semester)

    let filteredIds = candidates.map((c) => c.id)
    if (status === "pass" || status === "fail" || status === "pending") {
      const target = status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "PENDING"
      filteredIds = filteredIds.filter((id) => evaluations.get(id)?.overall === target)
    }

    const total = filteredIds.length
    const pageIds = new Set(filteredIds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))

    const students = await prisma.student.findMany({
      where: { id: { in: [...pageIds] } },
      orderBy: [{ department: "asc" }, { group: "asc" }, { studentId: "asc" }],
    })

    const rows = students.map((s) => {
      const evaluation = evaluations.get(s.id)!
      return {
        id: s.id,
        studentId: s.studentId,
        prefix: s.prefix,
        firstName: s.firstName,
        lastName: s.lastName,
        department: s.department,
        group: s.group,
        year: s.year,
        participation: evaluation.participation,
        vocationalActivities: evaluation.vocationalActivities,
        overall: evaluation.overall,
      }
    })

    return Response.json({ rows, total, page, totalPages: Math.ceil(total / PAGE_SIZE) })
  } catch (error) {
    console.error("Fetch summary students error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
