import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Plus, Users } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import StudentsTable from "@/components/admin/students-table"
import StudentFilters from "@/components/admin/student-filters"
import ExportDropdown from "@/components/admin/export-dropdown"
import { PaginationNav } from "@/components/ui/pagination-nav"

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{
    year?: string
    department?: string
    status?: string
    search?: string
    page?: string
  }>
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? "1"))
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  const where: Record<string, unknown> = {}
  if (params.year) where.year = params.year
  if (params.department) where.department = params.department
  if (params.status) where.isActive = params.status === "active"
  if (params.search) {
    where.OR = [
      { studentId: { contains: params.search } },
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
    ]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = where as any

  const [totalStudents, activeStudents, students] = await Promise.all([
    prisma.student.count({ where: w }),
    prisma.student.count({ where: { ...w, isActive: true } }),
    prisma.student.findMany({
      where: w,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { participations: true } } },
    }),
  ])

  const inactiveStudents = totalStudents - activeStudents
  const totalParticipations = students.reduce((sum, s) => sum + s._count.participations, 0)
  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl md:text-2xl font-bold font-thai">จัดการนักศึกษา</h1>
          </div>
          <p className="text-gray-500 font-thai mt-1 text-sm">เพิ่ม แก้ไข และจัดการข้อมูลนักศึกษา</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Suspense>
            <ExportDropdown
              excelUrl="/api/admin/export/students"
              printUrl="/admin/print/students"
            />
          </Suspense>
          <Link href="/admin/students/import">
            <Button variant="outline" className="font-thai gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">นำเข้าข้อมูล</span>
              <span className="sm:hidden">นำเข้า</span>
            </Button>
          </Link>
          <Link href="/admin/students/create">
            <Button className="font-thai gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มนักศึกษา</span>
              <span className="sm:hidden">เพิ่ม</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{totalStudents}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">นักศึกษาทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-success">{activeStudents}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">ใช้งาน</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-gray-400">{inactiveStudents}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">ปิดการใช้งาน</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-primary-600">{totalParticipations}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">การเข้าร่วมกิจกรรม</p>
          </CardContent>
        </Card>
      </div>

      <Suspense>
        <StudentFilters />
      </Suspense>

      <StudentsTable students={students} />

      <Suspense>
        <PaginationNav
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStudents}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Suspense>
    </div>
  )
}
