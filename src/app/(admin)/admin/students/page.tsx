import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Users } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import StudentsTable from "@/components/admin/students-table"
import StudentFilters from "@/components/admin/student-filters"

interface PageProps {
  searchParams: Promise<{
    year?: string
    department?: string
    status?: string
    search?: string
  }>
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "admin") redirect("/admin/login")

  const params = await searchParams

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

  const students = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participations: true } } },
  })

  const totalStudents = students.length
  const activeStudents = students.filter((s) => s.isActive).length
  const inactiveStudents = totalStudents - activeStudents
  const totalParticipations = students.reduce((sum, s) => sum + s._count.participations, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold font-thai">จัดการนักศึกษา</h1>
          </div>
          <p className="text-gray-500 font-thai mt-1">เพิ่ม แก้ไข และจัดการข้อมูลนักศึกษา</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/students/import">
            <Button variant="outline" className="font-thai gap-2">
              <Upload className="w-4 h-4" />
              Import CSV/Excel
            </Button>
          </Link>
          <Link href="/admin/students/create">
            <Button className="font-thai gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มนักศึกษา
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
    </div>
  )
}
