import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma"

/** All name variants (canonical name + aliases) for a Department row. */
export function departmentVariants(department: { name: string; aliases: string[] }): string[] {
  return [department.name, ...department.aliases]
}

/** Prisma where-clause fragment: does a Department row match this raw student.department string
 *  (either as its canonical name, or as one of its aliases)? */
export function departmentMatchesName(studentDepartmentName: string): Prisma.DepartmentWhereInput {
  return {
    OR: [{ name: studentDepartmentName }, { aliases: { has: studentDepartmentName } }],
  }
}

/**
 * Given a raw Student.department string (which may be a historical alias, e.g. a
 * department's name from a previous curriculum year), resolve every name variant
 * that should be treated as "the same department" — the canonical name plus all
 * aliases. Falls back to just the input string if no Department row has been
 * reconciled for it yet, so unmapped names keep working exactly as before.
 */
export async function resolveDepartmentVariants(studentDepartment: string): Promise<string[]> {
  const dept = await prisma.department.findFirst({
    where: departmentMatchesName(studentDepartment),
    select: { name: true, aliases: true },
  })
  if (!dept) return [studentDepartment]
  return departmentVariants(dept)
}
