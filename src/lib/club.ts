import { prisma } from "@/lib/prisma"
import { departmentMatchesName, departmentVariants } from "@/lib/department"

/** All department-name variants (canonical names + aliases) across every department in a club. */
export function clubDepartmentVariants(club: { departments: { name: string; aliases: string[] }[] }): string[] {
  return club.departments.flatMap((d) => departmentVariants(d))
}

/**
 * Resolve a raw Student.department string to the Club it belongs to (via the
 * Department row it matches, by name or alias), including every member
 * department's name+aliases so callers can build a full variant list.
 */
export async function resolveClubForDepartment(
  departmentName: string
): Promise<{ id: string; name: string; departments: { name: string; aliases: string[] }[] } | null> {
  const department = await prisma.department.findFirst({
    where: departmentMatchesName(departmentName),
    select: { id: true },
  })
  if (!department) return null

  const club = await prisma.club.findFirst({
    where: { departments: { some: { id: department.id } } },
    select: { id: true, name: true, departments: { select: { name: true, aliases: true } } },
  })
  return club
}

/**
 * All department-name variants (canonical names + aliases, across every
 * member department) for the Club that a raw Student.department string
 * resolves to. Falls back to the input string's own variants when it
 * doesn't belong to any club yet, so unmapped names keep working.
 */
export async function resolveClubDepartmentVariants(studentDepartment: string): Promise<string[]> {
  const club = await resolveClubForDepartment(studentDepartment)
  if (!club) return [studentDepartment]
  return clubDepartmentVariants(club)
}

/**
 * Batched version of resolveClubForDepartment for resolving many raw
 * Student.department strings to their club's display name at once (e.g.
 * page headers when printing/exporting across several departments) — one
 * query for all clubs instead of two queries per department. Falls back
 * to the input string itself for any name that doesn't belong to a club.
 */
export async function resolveClubNamesForDepartments(departmentNames: string[]): Promise<Map<string, string>> {
  const uniqueNames = [...new Set(departmentNames)]
  const result = new Map<string, string>()
  if (uniqueNames.length === 0) return result

  const clubs = await prisma.club.findMany({
    include: { departments: { select: { name: true, aliases: true } } },
  })

  const variantToClubName = new Map<string, string>()
  for (const club of clubs) {
    for (const variant of clubDepartmentVariants(club)) {
      variantToClubName.set(variant, club.name)
    }
  }

  for (const name of uniqueNames) {
    result.set(name, variantToClubName.get(name) ?? name)
  }
  return result
}
