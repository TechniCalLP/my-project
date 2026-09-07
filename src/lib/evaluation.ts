import { prisma } from "@/lib/prisma"
import { ActivityStatus, Prisma } from "@/generated/prisma"
import { departmentMatchesName, resolveDepartmentVariants } from "@/lib/department"

export type PartStatus = "PASS" | "FAIL" | "PENDING"

export interface VocationalActivityResult {
  id: string
  name: string
  passThreshold: number
  score: number | null
  status: PartStatus
}

export interface StudentEvaluation {
  participation: { joined: number; total: number; progress: number; status: PartStatus }
  vocationalActivities: VocationalActivityResult[]
  overall: PartStatus
}

export function requiredActivityFilter(studentYear: string, departmentVariants: string[]): Prisma.ActivityWhereInput {
  return {
    isDeleted: false,
    targetYear: studentYear,
    status: ActivityStatus.ACTIVE,
    OR: [
      { targetDepartments: { isEmpty: true } },
      { targetDepartments: { hasSome: departmentVariants } },
    ],
  }
}

export async function getStudentEvaluation(
  studentId: string,
  academicYear: string,
  semester: string
): Promise<StudentEvaluation> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: { year: true, department: true },
  })

  const departmentVariants = await resolveDepartmentVariants(student.department)
  const activityFilter = requiredActivityFilter(student.year, departmentVariants)

  const [joined, total, vocationalActivities] = await Promise.all([
    prisma.participation.count({ where: { studentId, activity: activityFilter } }),
    prisma.activity.count({ where: activityFilter }),
    prisma.vocationalActivity.findMany({
      where: {
        academicYear,
        semester,
        departments: { some: departmentMatchesName(student.department) },
        OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: student.year } }],
      },
      include: { scores: { where: { studentId, isDraft: false } } },
    }),
  ])

  const progress = total > 0 ? Math.round((joined / total) * 100) : 100
  const participationStatus: PartStatus = progress >= 100 ? "PASS" : "FAIL"

  const vocationalResults: VocationalActivityResult[] = vocationalActivities.map((va) => {
    const score = va.scores[0]?.score ?? null
    const status: PartStatus = score == null ? "PENDING" : score >= va.passThreshold ? "PASS" : "FAIL"
    return { id: va.id, name: va.name, passThreshold: va.passThreshold, score, status }
  })

  const parts = [participationStatus, ...vocationalResults.map((r) => r.status)]
  const overall: PartStatus =
    vocationalResults.length === 0 || parts.includes("PENDING")
      ? "PENDING"
      : parts.includes("FAIL")
        ? "FAIL"
        : "PASS"

  return {
    participation: { joined, total, progress, status: participationStatus },
    vocationalActivities: vocationalResults,
    overall,
  }
}

/**
 * Batched version of getStudentEvaluation for rendering a list of students at once
 * (e.g. the pass/fail summary page). Groups students by (year, department) so the
 * participation/vocational-activity queries run once per group instead of once per
 * student, avoiding an N+1 query fan-out against the connection pool.
 */
export async function getStudentEvaluations(
  studentIds: string[],
  academicYear: string,
  semester: string
): Promise<Map<string, StudentEvaluation>> {
  const result = new Map<string, StudentEvaluation>()
  if (studentIds.length === 0) return result

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, year: true, department: true },
  })

  const groups = new Map<string, { year: string; department: string; ids: string[] }>()
  for (const s of students) {
    const key = `${s.year}::${s.department}`
    if (!groups.has(key)) groups.set(key, { year: s.year, department: s.department, ids: [] })
    groups.get(key)!.ids.push(s.id)
  }

  await Promise.all(
    [...groups.values()].map(async ({ year, department, ids }) => {
      const departmentVariants = await resolveDepartmentVariants(department)
      const activityFilter = requiredActivityFilter(year, departmentVariants)

      const [total, participationCounts, vocationalActivities] = await Promise.all([
        prisma.activity.count({ where: activityFilter }),
        prisma.participation.groupBy({
          by: ["studentId"],
          where: { studentId: { in: ids }, activity: activityFilter },
          _count: { activityId: true },
        }),
        prisma.vocationalActivity.findMany({
          where: {
            academicYear,
            semester,
            departments: { some: departmentMatchesName(department) },
            OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: year } }],
          },
          include: { scores: { where: { studentId: { in: ids }, isDraft: false } } },
        }),
      ])

      const joinedByStudent = new Map(participationCounts.map((p) => [p.studentId, p._count.activityId]))

      for (const studentId of ids) {
        const joined = joinedByStudent.get(studentId) ?? 0
        const progress = total > 0 ? Math.round((joined / total) * 100) : 100
        const participationStatus: PartStatus = progress >= 100 ? "PASS" : "FAIL"

        const vocationalResults: VocationalActivityResult[] = vocationalActivities.map((va) => {
          const scoreRow = va.scores.find((sc) => sc.studentId === studentId)
          const score = scoreRow?.score ?? null
          const status: PartStatus = score == null ? "PENDING" : score >= va.passThreshold ? "PASS" : "FAIL"
          return { id: va.id, name: va.name, passThreshold: va.passThreshold, score, status }
        })

        const parts = [participationStatus, ...vocationalResults.map((r) => r.status)]
        const overall: PartStatus =
          vocationalResults.length === 0 || parts.includes("PENDING")
            ? "PENDING"
            : parts.includes("FAIL")
              ? "FAIL"
              : "PASS"

        result.set(studentId, {
          participation: { joined, total, progress, status: participationStatus },
          vocationalActivities: vocationalResults,
          overall,
        })
      }
    })
  )

  return result
}
