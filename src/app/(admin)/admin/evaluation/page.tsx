import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClipboardCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import EvaluationPeriodSelect from "@/components/admin/evaluation-period-select"
import GradeEvaluationCard from "@/components/admin/grade-evaluation-card"
import { ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { departmentVariants } from "@/lib/department"

interface PageProps {
  searchParams: Promise<{ academicYear?: string; semester?: string }>
}

export default async function EvaluationPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
    redirect("/admin/login")
  }

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

  const params = await searchParams
  const academicYear = params.academicYear ?? ACADEMIC_YEARS[0]
  const semester = params.semester ?? SEMESTERS[0]

  const activities = await prisma.vocationalActivity.findMany({
    where: {
      academicYear,
      semester,
      departments: { some: { id: teacher.departmentId! } },
    },
    select: { id: true, name: true, targetYears: true },
  })

  const gradeGroups = await Promise.all(
    YEARS.map(async (year) => {
      const applicableActivities = activities.filter(
        (a) => a.targetYears.length === 0 || a.targetYears.includes(year)
      )
      const applicableActivityIds = applicableActivities.map((a) => a.id)

      if (applicableActivityIds.length === 0) return null

      const yearWhere = { department: { in: departmentVariants(teacher.department!) }, isActive: true, year }

      const [total, scoreCounts, groupRows] = await Promise.all([
        prisma.student.count({ where: yearWhere }),
        prisma.vocationalActivityScore.groupBy({
          by: ["studentId"],
          where: { vocationalActivityId: { in: applicableActivityIds }, student: yearWhere, isDraft: false },
          _count: { vocationalActivityId: true },
        }),
        prisma.student.findMany({ where: yearWhere, select: { group: true }, distinct: ["group"] }),
      ])

      if (total === 0) return null

      const filled = scoreCounts.filter((c) => c._count.vocationalActivityId === applicableActivityIds.length).length
      const groupCount = new Set(groupRows.map((g) => g.group ?? "")).size

      return {
        year,
        total,
        filled,
        groupCount,
        activityNames: applicableActivities.map((a) => a.name),
      }
    })
  )

  const visibleGroups = gradeGroups.filter((g): g is NonNullable<typeof g> => g !== null)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">ประเมินกิจกรรมองค์การวิชาชีพ</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">
          กรอกคะแนนนักศึกษาแผนก{teacher.department.name} แยกตามชั้นปี
        </p>
      </div>

      <Suspense>
        <EvaluationPeriodSelect academicYear={academicYear} semester={semester} />
      </Suspense>

      {visibleGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 font-thai">
            ยังไม่มีกิจกรรมที่ต้องประเมินสำหรับช่วงเวลานี้
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((g) => (
            <GradeEvaluationCard
              key={g.year}
              year={g.year}
              academicYear={academicYear}
              semester={semester}
              total={g.total}
              filled={g.filled}
              groupCount={g.groupCount}
              activityNames={g.activityNames}
            />
          ))}
        </div>
      )}
    </div>
  )
}
