import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"
import { Suspense } from "react"
import TeacherStudentsTable from "@/components/admin/teacher-students-table"
import TeacherStudentFilters from "@/components/admin/teacher-student-filters"
import { PaginationNav } from "@/components/ui/pagination-nav"
import { departmentVariants } from "@/lib/department"

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{
    year?: string
    search?: string
    page?: string
  }>
}

export default async function MyStudentsPage({ searchParams }: PageProps) {
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
  const currentPage = Math.max(1, parseInt(params.page ?? "1"))
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  const where: Record<string, unknown> = { department: { in: departmentVariants(teacher.department) } }
  if (params.year) where.year = params.year
  if (params.search) {
    where.OR = [
      { studentId: { contains: params.search } },
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
    ]
  }

  const [totalStudents, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { participations: true } } },
    }),
  ])

  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">รายชื่อนักศึกษา</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">นักศึกษาแผนก{teacher.department.name} ทั้งหมด {totalStudents} คน</p>
      </div>

      <Suspense>
        <TeacherStudentFilters />
      </Suspense>

      <TeacherStudentsTable students={students} />

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
