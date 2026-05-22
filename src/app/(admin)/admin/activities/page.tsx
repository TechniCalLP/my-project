import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, Pencil, Ticket } from "lucide-react"
import { Suspense } from "react"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { DeleteActivityButton } from "@/components/admin/delete-activity-button"
import ActivityFilters from "@/components/admin/activity-filters"
import ExportDropdown from "@/components/admin/export-dropdown"
import { PaginationNav } from "@/components/ui/pagination-nav"

const ITEMS_PER_PAGE = 10

const STATUS_COLORS: Record<ActivityStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  DRAFT: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

interface PageProps {
  searchParams: Promise<{
    year?: string
    semester?: string
    category?: string
    status?: string
    search?: string
    page?: string
  }>
}

export default async function AdminActivitiesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? "1"))
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  const where: Record<string, unknown> = { isDeleted: false }
  if (params.year) where.targetYear = params.year
  if (params.semester) where.targetSemester = params.semester
  if (params.category) where.category = params.category as ActivityCategory
  if (params.status) where.status = params.status as ActivityStatus
  if (params.search) where.name = { contains: params.search, mode: "insensitive" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = where as any

  const [totalActivities, activeCount, completedCount, activities] = await Promise.all([
    prisma.activity.count({ where: w }),
    prisma.activity.count({ where: { ...w, status: ActivityStatus.ACTIVE } }),
    prisma.activity.count({ where: { ...w, status: ActivityStatus.COMPLETED } }),
    prisma.activity.findMany({
      where: w,
      skip,
      take: ITEMS_PER_PAGE,
      include: { _count: { select: { participations: true, activityCodes: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const totalParticipations = activities.reduce((sum, a) => sum + a._count.participations, 0)
  const totalPages = Math.ceil(totalActivities / ITEMS_PER_PAGE)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold font-thai">จัดการกิจกรรม</h1>
        <div className="flex gap-2">
          <Suspense>
            <ExportDropdown
              excelUrl="/api/admin/export/activities"
              printUrl="/admin/print/activities"
            />
          </Suspense>
          <Link href="/admin/activities/new">
            <Button className="font-thai">+ สร้างกิจกรรม</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{totalActivities}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">กิจกรรมทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-primary-600">{activeCount}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">เปิดรับสมัคร</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-gray-600">{completedCount}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">เสร็จสิ้น</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-success">{totalParticipations}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">ผู้เข้าร่วมทั้งหมด</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Suspense>
        <ActivityFilters />
      </Suspense>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-base">ทั้งหมด {totalActivities} กิจกรรม</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai whitespace-nowrap">ชื่อกิจกรรม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap hidden md:table-cell">ประเภท</TableHead>
                  <TableHead className="font-thai whitespace-nowrap hidden lg:table-cell">ระดับชั้น</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="font-thai text-right whitespace-nowrap hidden sm:table-cell">รหัส</TableHead>
                  <TableHead className="font-thai text-right whitespace-nowrap hidden sm:table-cell">ผู้เข้าร่วม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 font-thai py-8">
                      {params.search ? `ไม่พบกิจกรรมที่ค้นหา "${params.search}"` : "ยังไม่มีกิจกรรม"}
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((a) => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium font-thai">
                        <div>
                          <p className="whitespace-nowrap">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.targetYear} / {a.targetSemester}</p>
                          <p className="text-xs text-gray-400 md:hidden mt-0.5">
                            {CATEGORY_NAMES[a.category]} · {a._count.participations} คน
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs font-thai text-gray-600">{CATEGORY_NAMES[a.category]}</span>
                      </TableCell>
                      <TableCell className="text-sm font-thai hidden lg:table-cell">{a.targetYear}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[a.status]} border-0 font-thai text-xs whitespace-nowrap`}>
                          {STATUS_LABELS[a.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono hidden sm:table-cell">{a._count.activityCodes}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">{a._count.participations}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/activities/${a.id}`}>
                            <Button variant="ghost" size="sm" className="font-thai gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">ดู</span>
                            </Button>
                          </Link>
                          <Link href={`/admin/activities/${a.id}/codes`}>
                            <Button variant="ghost" size="sm" className="font-thai gap-1 text-primary-600">
                              <Ticket className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">รหัส</span>
                            </Button>
                          </Link>
                          <Link href={`/admin/activities/${a.id}/edit`}>
                            <Button variant="ghost" size="sm" className="font-thai gap-1 text-warning">
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">แก้ไข</span>
                            </Button>
                          </Link>
                          <DeleteActivityButton id={a.id} name={a.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Suspense>
        <PaginationNav
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalActivities}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Suspense>
    </div>
  )
}
