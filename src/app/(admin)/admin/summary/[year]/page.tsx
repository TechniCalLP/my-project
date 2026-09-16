import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"
import { ACADEMIC_YEARS, SEMESTERS } from "@/lib/constants"
import { clubDepartmentVariants, resolveClubById } from "@/lib/club"

interface PageProps {
  params: Promise<{ year: string }>
  searchParams: Promise<{ academicYear?: string; semester?: string; club?: string }>
}

export default async function SummaryYearPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const { year: rawYear } = await params
  const year = decodeURIComponent(rawYear)
  const sp = await searchParams
  const academicYear = sp.academicYear ?? ACADEMIC_YEARS[0]
  const semester = sp.semester ?? SEMESTERS[0]

  const backParams = new URLSearchParams({ academicYear, semester, ...(sp.club ? { club: sp.club } : {}) })

  // Activities table for this year — same shape/logic as the teacher's
  // ประเมินกิจกรรมองค์การวิชาชีพ list (ชื่อกิจกรรม / เกณฑ์ผ่าน / ความคืบหน้า),
  // just scoped by the club this page was opened for instead of a teacher's
  // own club. "ดูรายชื่อ" opens a dedicated page per activity instead of
  // score entry (this page can be reached by non-teacher viewers).
  let deptVariants: string[] | undefined
  if (sp.club) {
    const club = await resolveClubById(sp.club)
    if (club) deptVariants = clubDepartmentVariants(club)
  }

  const activitiesForYear = await prisma.vocationalActivity.findMany({
    where: {
      academicYear,
      semester,
      OR: [{ targetYears: { isEmpty: true } }, { targetYears: { has: year } }],
      ...(sp.club ? { clubs: { some: { id: sp.club } } } : {}),
    },
    select: { id: true, name: true, passThreshold: true },
    orderBy: { name: "asc" },
  })

  const studentWhere = { isActive: true, year, ...(deptVariants ? { department: { in: deptVariants } } : {}) }
  const totalStudentsForYear = await prisma.student.count({ where: studentWhere })

  const activityRows = await Promise.all(
    activitiesForYear.map(async (a) => {
      const filled = await prisma.vocationalActivityScore.count({
        where: { vocationalActivityId: a.id, isDraft: false, student: studentWhere },
      })
      return { id: a.id, name: a.name, passThreshold: a.passThreshold, filled }
    })
  )

  const activityLinkParams = new URLSearchParams({ academicYear, semester, ...(sp.club ? { club: sp.club } : {}) }).toString()

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <Link href={`/admin/summary?${backParams.toString()}`}>
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

      {activityRows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500 font-thai text-sm">
            ยังไม่มีกิจกรรมองค์การวิชาชีพสำหรับชั้นปีนี้ในช่วงเวลาที่เลือก
          </CardContent>
        </Card>
      ) : (
        <Card>
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
                  {activityRows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-thai font-medium">{a.name}</TableCell>
                      <TableCell className="font-thai text-sm text-gray-500 whitespace-nowrap">
                        ≥{a.passThreshold}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-thai text-xs border-0 whitespace-nowrap ${
                            a.filled === totalStudentsForYear && totalStudentsForYear > 0
                              ? "bg-success/10 text-success"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {a.filled === totalStudentsForYear && totalStudentsForYear > 0 ? "กรอกแล้ว" : "รอดำเนินการ"} ({a.filled}/{totalStudentsForYear})
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/summary/${encodeURIComponent(year)}/${a.id}?${activityLinkParams}`}>
                          <Button size="sm" variant="outline" className="font-thai gap-1.5">
                            <Filter className="w-3.5 h-3.5" />
                            ดูรายชื่อ
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
      )}
    </div>
  )
}
