import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, PenLine } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import ActivityScoreEntry from "@/components/admin/activity-score-entry"
import { clubDepartmentVariants } from "@/lib/club"

interface PageProps {
  params: Promise<{ activityId: string }>
  searchParams: Promise<{ year?: string; academicYear?: string; semester?: string }>
}

export default async function ActivityEvaluationPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "TEACHER") {
    redirect("/admin/login")
  }

  const { activityId } = await params
  const sp = await searchParams
  const { year, academicYear, semester } = sp
  if (!year || !academicYear || !semester) redirect("/admin/evaluation")

  const teacher = await prisma.admin.findUnique({
    where: { id: session.user.id },
    include: { club: { include: { departments: true } } },
  })
  if (!teacher?.club) redirect("/admin/evaluation")

  const activity = await prisma.vocationalActivity.findFirst({
    where: {
      id: activityId,
      academicYear,
      semester,
      clubs: { some: { id: teacher.clubId! } },
      OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: year } }],
    },
    select: { id: true, name: true, passThreshold: true },
  })
  if (!activity) redirect("/admin/evaluation")

  const backParams = new URLSearchParams({ academicYear, semester })
  const studentRows = await prisma.student.findMany({
    where: { department: { in: clubDepartmentVariants(teacher.club) }, isActive: true, year },
    select: { group: true, department: true },
    distinct: ["group", "department"],
  })
  const groups = [...new Set(studentRows.map((s) => s.group).filter((g): g is string => g != null))].sort()
  const departments = [...new Set(studentRows.map((s) => s.department))].sort()

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <Link
          href={`/admin/evaluation?${backParams.toString()}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-thai mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับไปหน้ารายการกิจกรรม
        </Link>
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">{activity.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className="font-thai text-xs">ชั้น {year}</Badge>
          <Badge variant="outline" className="font-thai text-xs">เกณฑ์ผ่าน ≥{activity.passThreshold}%</Badge>
          <Badge variant="outline" className="font-thai text-xs">
            ปีการศึกษา {academicYear} {semester}
          </Badge>
        </div>
      </div>

      <ActivityScoreEntry
        activityId={activity.id}
        year={year}
        academicYear={academicYear}
        semester={semester}
        groups={groups}
        departments={departments}
      />
    </div>
  )
}
