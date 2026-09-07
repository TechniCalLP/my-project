import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ListChecks } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import EvaluationPeriodSelect from "@/components/admin/evaluation-period-select"
import SummaryGradeCard from "@/components/admin/summary-grade-card"
import { getStudentEvaluations } from "@/lib/evaluation"
import { ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { departmentMatchesName, departmentVariants } from "@/lib/department"

interface PageProps {
  searchParams: Promise<{ academicYear?: string; semester?: string }>
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const isTeacher = session.user.adminRole === "TEACHER"
  let teacherDepartmentName: string | null = null
  let teacherDepartmentVariants: string[] | null = null

  if (isTeacher) {
    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { department: true },
    })
    if (!teacher?.department) {
      return (
        <div className="p-4 md:p-8">
          <Card>
            <CardContent className="py-12 text-center text-gray-500 font-thai">
              บัญชีของท่านยังไม่ได้ผูกกับแผนก กรุณาติดต่อผู้ดูแลระบบ
            </CardContent>
          </Card>
        </div>
      )
    }
    teacherDepartmentName = teacher.department.name
    teacherDepartmentVariants = departmentVariants(teacher.department)
  }

  const params = await searchParams
  const academicYear = params.academicYear ?? ACADEMIC_YEARS[0]
  const semester = params.semester ?? SEMESTERS[0]

  const activities = await prisma.vocationalActivity.findMany({
    where: {
      academicYear,
      semester,
      ...(teacherDepartmentName ? { departments: { some: departmentMatchesName(teacherDepartmentName) } } : {}),
    },
    select: { name: true, targetYears: true },
  })

  const gradeGroups = await Promise.all(
    YEARS.map(async (year) => {
      const applicableActivities = activities.filter(
        (a) => a.targetYears.length === 0 || a.targetYears.includes(year)
      )
      if (applicableActivities.length === 0) return null

      const where = {
        isActive: true,
        year,
        ...(teacherDepartmentVariants ? { department: { in: teacherDepartmentVariants } } : {}),
      }
      const students = await prisma.student.findMany({ where, select: { id: true } })
      if (students.length === 0) return null

      const evaluations = await getStudentEvaluations(students.map((s) => s.id), academicYear, semester)

      let passCount = 0
      let failCount = 0
      let pendingCount = 0
      for (const evaluation of evaluations.values()) {
        if (evaluation.overall === "PASS") passCount++
        else if (evaluation.overall === "FAIL") failCount++
        else pendingCount++
      }

      const activityNames = [...new Set(applicableActivities.map((a) => a.name))]

      return { year, total: students.length, passCount, failCount, pendingCount, activityNames }
    })
  )

  const visibleGroups = gradeGroups.filter((g): g is NonNullable<typeof g> => g !== null)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">สรุปผลการประเมิน</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">
          ผลรวมกิจกรรมภาคบังคับและกิจกรรมองค์การวิชาชีพ แยกตามชั้นปี
          {teacherDepartmentName && ` — แผนก${teacherDepartmentName}`}
        </p>
      </div>

      <Suspense>
        <EvaluationPeriodSelect academicYear={academicYear} semester={semester} basePath="/admin/summary" />
      </Suspense>

      {visibleGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 font-thai">
            ยังไม่พบนักศึกษาสำหรับช่วงเวลานี้
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGroups.map((g) => (
            <SummaryGradeCard
              key={g.year}
              year={g.year}
              academicYear={academicYear}
              semester={semester}
              total={g.total}
              passCount={g.passCount}
              failCount={g.failCount}
              pendingCount={g.pendingCount}
              activityNames={g.activityNames}
            />
          ))}
        </div>
      )}
    </div>
  )
}
