import { prisma } from "@/lib/prisma"
import { ActivityStatus, ActivityType, Prisma } from "@/generated/prisma"
import { resolveDepartmentVariants } from "@/lib/department"
import { resolveClubForDepartment } from "@/lib/club"

export type PartStatus = "PASS" | "FAIL" | "PENDING"

export interface VocationalActivityResult {
  id: string
  name: string
  passThreshold: number
  score: number | null
  status: PartStatus
}

export interface RequiredActivityResult {
  id: string
  name: string
  joined: boolean
}

export interface StudentEvaluation {
  participation: { joined: number; total: number; progress: number; status: PartStatus }
  requiredActivityNames: string[]
  requiredActivities: RequiredActivityResult[]
  vocationalActivities: VocationalActivityResult[]
  overall: PartStatus
}

export function requiredActivityFilter(
  studentYear: string,
  semester: string,
  departmentVariants: string[]
): Prisma.ActivityWhereInput {
  return {
    isDeleted: false,
    targetYear: studentYear,
    targetSemester: semester,
    // ACTIVE (currently open) and COMPLETED (already happened) both still count toward
    // the requirement — only DRAFT (not published yet) and CANCELLED (never happened)
    // should be excluded. Filtering to ACTIVE-only would silently drop an activity from
    // everyone's required total the moment staff mark it COMPLETED after the event ends.
    status: { in: [ActivityStatus.ACTIVE, ActivityStatus.COMPLETED] },
    type: ActivityType.MANDATORY,
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
  const activityFilter = requiredActivityFilter(student.year, semester, departmentVariants)
  const club = await resolveClubForDepartment(student.department)

  const [joinedActivities, requiredActivities, vocationalActivities] = await Promise.all([
    prisma.participation.findMany({ where: { studentId, activity: activityFilter }, select: { activityId: true } }),
    prisma.activity.findMany({ where: activityFilter, select: { id: true, name: true } }),
    club
      ? prisma.vocationalActivity.findMany({
          where: {
            academicYear,
            semester,
            clubs: { some: { id: club.id } },
            OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: student.year } }],
          },
          include: { scores: { where: { studentId, isDraft: false } } },
        })
      : Promise.resolve([]),
  ])

  const joinedIdSet = new Set(joinedActivities.map((p) => p.activityId).filter((id): id is string => id != null))
  const joined = joinedIdSet.size
  const total = requiredActivities.length
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
    requiredActivityNames: requiredActivities.map((a) => a.name),
    requiredActivities: requiredActivities.map((a) => ({ id: a.id, name: a.name, joined: joinedIdSet.has(a.id) })),
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
      const activityFilter = requiredActivityFilter(year, semester, departmentVariants)
      const club = await resolveClubForDepartment(department)

      const [requiredActivities, participations, vocationalActivities] = await Promise.all([
        prisma.activity.findMany({ where: activityFilter, select: { id: true, name: true } }),
        prisma.participation.findMany({
          where: { studentId: { in: ids }, activity: activityFilter },
          select: { studentId: true, activityId: true },
        }),
        club
          ? prisma.vocationalActivity.findMany({
              where: {
                academicYear,
                semester,
                clubs: { some: { id: club.id } },
                OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: year } }],
              },
              include: { scores: { where: { studentId: { in: ids }, isDraft: false } } },
            })
          : Promise.resolve([]),
      ])

      const joinedIdsByStudent = new Map<string, Set<string>>()
      for (const p of participations) {
        if (!p.activityId) continue
        if (!joinedIdsByStudent.has(p.studentId)) joinedIdsByStudent.set(p.studentId, new Set())
        joinedIdsByStudent.get(p.studentId)!.add(p.activityId)
      }
      const total = requiredActivities.length
      const requiredActivityNames = requiredActivities.map((a) => a.name)

      for (const studentId of ids) {
        const joinedIdSet = joinedIdsByStudent.get(studentId) ?? new Set<string>()
        const joined = joinedIdSet.size
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
          requiredActivityNames,
          requiredActivities: requiredActivities.map((a) => ({ id: a.id, name: a.name, joined: joinedIdSet.has(a.id) })),
          vocationalActivities: vocationalResults,
          overall,
        })
      }
    })
  )

  return result
}
