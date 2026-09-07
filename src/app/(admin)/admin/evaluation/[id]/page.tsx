import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClipboardCheck, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import VocationalActivityScoreForm from "@/components/admin/vocational-activity-score-form"
import { departmentVariants } from "@/lib/department"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VocationalActivityDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
    redirect("/admin/login")
  }

  const { id } = await params

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

  const activity = await prisma.vocationalActivity.findUnique({
    where: { id },
    include: { departments: true },
  })

  if (!activity) notFound()
  if (!activity.departments.some((d) => d.id === teacher.departmentId)) {
    redirect("/admin/evaluation")
  }

  const students = await prisma.student.findMany({
    where: {
      department: { in: departmentVariants(teacher.department) },
      isActive: true,
      ...(activity.targetYears.length > 0 ? { year: { in: activity.targetYears } } : {}),
    },
    orderBy: [{ year: "asc" }, { group: "asc" }, { studentId: "asc" }],
  })

  const scores = await prisma.vocationalActivityScore.findMany({
    where: { vocationalActivityId: id, studentId: { in: students.map((s) => s.id) } },
  })
  const scoreByStudent = new Map(scores.map((s) => [s.studentId, s.score]))

  const rows = students.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    prefix: s.prefix,
    firstName: s.firstName,
    lastName: s.lastName,
    year: s.year,
    group: s.group,
    score: scoreByStudent.get(s.id) ?? null,
  }))

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <Link href="/admin/evaluation">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">{activity.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <Badge variant="outline" className="font-thai text-xs">เกณฑ์ผ่าน {activity.passThreshold}%</Badge>
          <Badge variant="outline" className="font-thai text-xs">
            {activity.targetYears.length === 0 ? "ทุกชั้นปี" : activity.targetYears.join(", ")}
          </Badge>
          <span className="text-xs text-gray-400 font-thai">
            {activity.academicYear} / {activity.semester} · นักศึกษาแผนก{teacher.department.name}
          </span>
        </div>
      </div>

      <VocationalActivityScoreForm activityId={activity.id} students={rows} />
    </div>
  )
}
