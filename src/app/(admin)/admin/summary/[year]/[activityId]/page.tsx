import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import SummaryYearPanel from "@/components/admin/summary-year-panel"
import { ACADEMIC_YEARS, SEMESTERS } from "@/lib/constants"

interface PageProps {
  params: Promise<{ year: string; activityId: string }>
  searchParams: Promise<{ academicYear?: string; semester?: string; club?: string }>
}

export default async function SummaryActivityDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const { year: rawYear, activityId } = await params
  const year = decodeURIComponent(rawYear)
  const sp = await searchParams
  const academicYear = sp.academicYear ?? ACADEMIC_YEARS[0]
  const semester = sp.semester ?? SEMESTERS[0]
  const isAdminView = session.user.adminRole !== "TEACHER"

  const activity = await prisma.vocationalActivity.findFirst({
    where: {
      id: activityId,
      academicYear,
      semester,
      OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: year } }],
      ...(sp.club ? { clubs: { some: { id: sp.club } } } : {}),
    },
    select: { id: true, name: true, passThreshold: true },
  })

  const backParams = new URLSearchParams({ academicYear, semester, ...(sp.club ? { club: sp.club } : {}) })
  if (!activity) redirect(`/admin/summary/${encodeURIComponent(year)}?${backParams.toString()}`)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <Link href={`/admin/summary/${encodeURIComponent(year)}?${backParams.toString()}`}>
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-xl md:text-2xl font-bold font-thai">{activity.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className="font-thai text-xs">ชั้น {year}</Badge>
          <Badge variant="outline" className="font-thai text-xs">เกณฑ์ผ่าน ≥{activity.passThreshold}%</Badge>
          <Badge variant="outline" className="font-thai text-xs">ปีการศึกษา {academicYear} {semester}</Badge>
        </div>
      </div>

      <SummaryYearPanel
        year={year}
        academicYear={academicYear}
        semester={semester}
        isAdminView={isAdminView}
        clubId={sp.club}
        activityId={activity.id}
        activityName={activity.name}
        hideActivityBanner
      />
    </div>
  )
}
