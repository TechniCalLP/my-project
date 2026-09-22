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
 * (e.g. the pass/fail summary page). Unlike the per-group version this replaced,
 * this issues a fixed, small number of bulk queries (students, departments, clubs,
 * required activities, participations, vocational activities, scores) regardless of
 * how many distinct (year, department) groups the student list spans, then does all
 * the group-specific filtering in memory. The old version ran a handful of queries
 * PER group — fine for a teacher's single club, but SUPER_ADMIN's all-clubs summary
 * page could span 50+ groups, turning into hundreds of round trips.
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

  const years = [...new Set(students.map((s) => s.year))]

  // Whole-table fetches (department/club counts are small for a single college) so
  // every department/club lookup below is a plain in-memory map, not a query.
  const [allDepartments, allClubs] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true, aliases: true } }),
    prisma.club.findMany({
      select: { id: true, name: true, departments: { select: { id: true, name: true, aliases: true } } },
    }),
  ])

  const findDepartmentRow = (raw: string) =>
    allDepartments.find((d) => d.name === raw || d.aliases.includes(raw)) ?? null

  const departmentVariantsCache = new Map<string, string[]>()
  const getDepartmentVariants = (raw: string): string[] => {
    const cached = departmentVariantsCache.get(raw)
    if (cached) return cached
    const row = findDepartmentRow(raw)
    const variants = row ? [row.name, ...row.aliases] : [raw]
    departmentVariantsCache.set(raw, variants)
    return variants
  }

  const clubCache = new Map<string, { id: string; name: string } | null>()
  const getClub = (raw: string): { id: string; name: string } | null => {
    if (clubCache.has(raw)) return clubCache.get(raw) ?? null
    const row = findDepartmentRow(raw)
    const club = row ? (allClubs.find((c) => c.departments.some((d) => d.id === row.id)) ?? null) : null
    clubCache.set(raw, club)
    return club
  }

  const groups = new Map<string, { year: string; department: string; ids: string[] }>()
  for (const s of students) {
    const key = `${s.year}::${s.department}`
    if (!groups.has(key)) groups.set(key, { year: s.year, department: s.department, ids: [] })
    groups.get(key)!.ids.push(s.id)
  }

  const groupList = [...groups.values()].map((g) => ({
    ...g,
    departmentVariants: getDepartmentVariants(g.department),
    club: getClub(g.department),
  }))

  const clubIds = [...new Set(groupList.map((g) => g.club?.id).filter((id): id is string => id != null))]

  const [allRequiredActivities, allParticipations, allVocationalActivities] = await Promise.all([
    prisma.activity.findMany({
      where: {
        isDeleted: false,
        targetSemester: semester,
        status: { in: [ActivityStatus.ACTIVE, ActivityStatus.COMPLETED] },
        type: ActivityType.MANDATORY,
        targetYear: { in: years },
      },
      select: { id: true, name: true, targetYear: true, targetDepartments: true },
    }),
    prisma.participation.findMany({
      where: {
        studentId: { in: studentIds },
        activity: {
          isDeleted: false,
          targetSemester: semester,
          status: { in: [ActivityStatus.ACTIVE, ActivityStatus.COMPLETED] },
          type: ActivityType.MANDATORY,
        },
      },
      select: { studentId: true, activityId: true },
    }),
    clubIds.length > 0
      ? prisma.vocationalActivity.findMany({
          where: { academicYear, semester, clubs: { some: { id: { in: clubIds } } } },
          select: {
            id: true,
            name: true,
            passThreshold: true,
            targetYears: true,
            clubs: { select: { id: true } },
            scores: { where: { studentId: { in: studentIds }, isDraft: false }, select: { studentId: true, score: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const joinedIdsByStudent = new Map<string, Set<string>>()
  for (const p of allParticipations) {
    if (!p.activityId) continue
    if (!joinedIdsByStudent.has(p.studentId)) joinedIdsByStudent.set(p.studentId, new Set())
    joinedIdsByStudent.get(p.studentId)!.add(p.activityId)
  }

  for (const group of groupList) {
    const requiredActivities = allRequiredActivities.filter(
      (a) =>
        a.targetYear === group.year &&
        (a.targetDepartments.length === 0 || a.targetDepartments.some((d) => group.departmentVariants.includes(d)))
    )
    const vocationalActivities = group.club
      ? allVocationalActivities.filter(
          (va) =>
            va.clubs.some((c) => c.id === group.club!.id) &&
            (va.targetYears.length === 0 || va.targetYears.includes(group.year))
        )
      : []

    const total = requiredActivities.length
    const requiredActivityNames = requiredActivities.map((a) => a.name)

    for (const studentId of group.ids) {
      const joinedIdSet = joinedIdsByStudent.get(studentId) ?? new Set<string>()
      const joined = requiredActivities.filter((a) => joinedIdSet.has(a.id)).length
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
  }

  return result
}
