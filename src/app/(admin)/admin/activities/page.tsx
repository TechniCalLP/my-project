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

const STATUS_COLORS: Record<ActivityStatus, string> = {
  ACTIVE: "bg-primary-100 text-primary-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-secondary-100 text-secondary-700",
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
  }>
}

export default async function AdminActivitiesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const params = await searchParams
  const where: Record<string, unknown> = {}
  if (params.year) where.targetYear = params.year
  if (params.semester) where.targetSemester = params.semester
  if (params.category) where.category = params.category as ActivityCategory
  if (params.status) where.status = params.status as ActivityStatus

  const activities = await prisma.activity.findMany({
    where,
    include: {
      _count: { select: { participations: true, activityCodes: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalParticipations = activities.reduce((sum, a) => sum + a._count.participations, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-thai">จัดการกิจกรรม</h1>
        <Link href="/admin/activities/new">
          <Button className="font-thai">+ สร้างกิจกรรม</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold">{activities.length}</p>
            <p className="text-sm text-gray-500 font-thai mt-1">กิจกรรมทั้งหมด</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-primary-600">
              {activities.filter((a) => a.status === ActivityStatus.ACTIVE).length}
            </p>
            <p className="text-sm text-gray-500 font-thai mt-1">เปิดรับสมัคร</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-gray-600">
              {activities.filter((a) => a.status === ActivityStatus.COMPLETED).length}
            </p>
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
          <CardTitle className="font-thai text-base">ทั้งหมด {activities.length} กิจกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-thai" style={{ width: "28%" }}>ชื่อกิจกรรม</TableHead>
                <TableHead className="font-thai" style={{ width: "14%" }}>ประเภท</TableHead>
                <TableHead className="font-thai" style={{ width: "12%" }}>ระดับชั้น</TableHead>
                <TableHead className="font-thai" style={{ width: "14%" }}>สถานะ</TableHead>
                <TableHead className="font-thai text-right" style={{ width: "10%" }}>รหัส</TableHead>
                <TableHead className="font-thai text-right" style={{ width: "10%" }}>ผู้เข้าร่วม</TableHead>
                <TableHead className="font-thai" style={{ width: "12%" }}>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 font-thai py-8">
                    ยังไม่มีกิจกรรม
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((a) => (
                  <TableRow key={a.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium font-thai">
                      <div>
                        <p>{a.name}</p>
                        <p className="text-xs text-gray-400">{a.targetYear} / {a.targetSemester}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-thai text-gray-600">{CATEGORY_NAMES[a.category]}</span>
                    </TableCell>
                    <TableCell className="text-sm font-thai">{a.targetYear}</TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[a.status]} border-0 font-thai text-xs`}>
                        {STATUS_LABELS[a.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{a._count.activityCodes}</TableCell>
                    <TableCell className="text-right">{a._count.participations}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/activities/${a.id}`}>
                          <Button variant="ghost" size="sm" className="font-thai gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            ดู
                          </Button>
                        </Link>
                        <Link href={`/admin/activities/${a.id}/codes`}>
                          <Button variant="ghost" size="sm" className="font-thai gap-1 text-primary-600">
                            <Ticket className="w-3.5 h-3.5" />
                            รหัส
                          </Button>
                        </Link>
                        <Link href={`/admin/activities/${a.id}/edit`}>
                          <Button variant="ghost" size="sm" className="font-thai gap-1 text-warning">
                            <Pencil className="w-3.5 h-3.5" />
                            แก้ไข
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
        </CardContent>
      </Card>
    </div>
  )
}
