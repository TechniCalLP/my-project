import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ClipboardCheck, PenLine } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Suspense } from "react"
import EvaluationPeriodSelect from "@/components/admin/evaluation-period-select"
import { ACADEMIC_YEARS, SEMESTERS, YEARS } from "@/lib/constants"
import { clubDepartmentVariants } from "@/lib/club"

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
    include: { club: { include: { departments: true } } },
  })

  if (!teacher?.club) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-500 font-thai">
            บัญชีของท่านยังไม่ได้ผูกกับชมรม กรุณาติดต่อผู้ดูแลระบบ
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
      clubs: { some: { id: teacher.clubId! } },
    },
    select: { id: true, name: true, passThreshold: true, targetYears: true },
  })

  const gradeGroups = await Promise.all(
    YEARS.map(async (year) => {
      const applicableActivities = activities.filter(
        (a) => a.targetYears.length === 0 || a.targetYears.includes(year)
      )
      if (applicableActivities.length === 0) return null

      const yearWhere = { department: { in: clubDepartmentVariants(teacher.club!) }, isActive: true, year }
      const total = await prisma.student.count({ where: yearWhere })
      if (total === 0) return null

      const groupRows = await prisma.student.findMany({ where: yearWhere, select: { group: true }, distinct: ["group"] })
      const groups = [...new Set(groupRows.map((g) => g.group).filter((g): g is string => g != null))].sort()

      const activityStats = await Promise.all(
        applicableActivities.map(async (a) => {
          const filled = await prisma.vocationalActivityScore.count({
            where: { vocationalActivityId: a.id, isDraft: false, student: yearWhere },
          })
          return { id: a.id, name: a.name, passThreshold: a.passThreshold, filled }
        })
      )

      return { year, total, groupCount: groups.length, activities: activityStats }
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
          กรอกคะแนนนักศึกษาชมรม{teacher.club.name} แยกตามชั้นปี
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
        <div className="space-y-4">
          {visibleGroups.map((g) => (
            <Card key={g.year}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle className="font-thai text-base flex items-center gap-2">
                  {g.year}
                  <Badge variant="outline" className="font-thai text-xs">{g.total} คน</Badge>
                  <Badge variant="outline" className="font-thai text-xs">{g.groupCount} กลุ่ม</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-thai whitespace-nowrap">ชื่อกิจกรรม</TableHead>
                        <TableHead className="font-thai whitespace-nowrap">เกณฑ์ผ่าน</TableHead>
                        <TableHead className="font-thai whitespace-nowrap">ความคืบหน้า</TableHead>
                        <TableHead className="font-thai text-right whitespace-nowrap">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.activities.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-thai font-medium">{a.name}</TableCell>
                          <TableCell className="font-thai text-sm text-gray-500 whitespace-nowrap">
                            ≥{a.passThreshold}%
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`font-thai text-xs border-0 whitespace-nowrap ${
                                a.filled === g.total && g.total > 0 ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {a.filled === g.total && g.total > 0 ? "กรอกแล้ว" : "รอดำเนินการ"} ({a.filled}/{g.total})
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/admin/evaluation/${a.id}?year=${encodeURIComponent(g.year)}&academicYear=${encodeURIComponent(academicYear)}&semester=${encodeURIComponent(semester)}`}
                            >
                              <Button size="sm" variant="outline" className="font-thai gap-1.5">
                                <PenLine className="w-3.5 h-3.5" />
                                กรอกคะแนน
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
