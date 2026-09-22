import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requiredActivityFilter } from "@/lib/evaluation"
import { resolveDepartmentVariants } from "@/lib/department"
import { SEMESTERS } from "@/lib/constants"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const studentDbId = session.user.id
  const studentYear = session.user.year ?? ""
  const studentDept = session.user.department ?? ""

  const departmentVariants = await resolveDepartmentVariants(studentDept)
  // No per-student "current semester" selector exists yet — default to the same
  // period every admin-facing period picker in the app defaults to.
  const activityFilter = requiredActivityFilter(studentYear, SEMESTERS[0], departmentVariants)

  const [joined, total] = await Promise.all([
    prisma.participation.count({ where: { studentId: studentDbId, activity: activityFilter } }),
    prisma.activity.count({ where: activityFilter }),
  ])

  const remaining = Math.max(0, total - joined)
  const progress = total > 0 ? Math.round((joined / total) * 100) : 0

  return Response.json({ joined, total, remaining, progress })
}
