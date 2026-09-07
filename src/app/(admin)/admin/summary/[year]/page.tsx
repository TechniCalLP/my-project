import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import SummaryExportButtons from "@/components/admin/summary-export-buttons"
import SummaryYearDetail from "@/components/admin/summary-year-detail"
import { ACADEMIC_YEARS, SEMESTERS } from "@/lib/constants"

interface PageProps {
  params: Promise<{ year: string }>
  searchParams: Promise<{ academicYear?: string; semester?: string }>
}

export default async function SummaryYearPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const { year: rawYear } = await params
  const year = decodeURIComponent(rawYear)
  const sp = await searchParams
  const academicYear = sp.academicYear ?? ACADEMIC_YEARS[0]
  const semester = sp.semester ?? SEMESTERS[0]
  const isAdminView = session.user.adminRole !== "TEACHER"

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/summary?academicYear=${academicYear}&semester=${encodeURIComponent(semester)}`}>
            <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold font-thai">สรุปผลการประเมิน — {year}</h1>
          <p className="text-gray-500 font-thai mt-1 text-sm">
            ปีการศึกษา {academicYear} · {semester}
          </p>
        </div>
        <SummaryExportButtons year={year} academicYear={academicYear} semester={semester} />
      </div>

      <SummaryYearDetail year={year} academicYear={academicYear} semester={semester} isAdminView={isAdminView} />
    </div>
  )
}
