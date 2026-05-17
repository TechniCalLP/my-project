import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, Pencil, Users, Ticket } from "lucide-react"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { DeleteActivityButton } from "@/components/admin/delete-activity-button"

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

interface Activity {
  id: string
  name: string
  category: ActivityCategory
  status: ActivityStatus
  targetYear: string
  targetSemester: string
  _count: {
    participations: number
  }
}

interface RecentActivitiesProps {
  activities: Activity[]
}

export default function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-thai">กิจกรรมล่าสุด</CardTitle>
        <Link href="/admin/activities">
          <Button variant="outline" size="sm" className="font-thai">ดูทั้งหมด</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 font-thai py-8">ยังไม่มีกิจกรรม</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai whitespace-nowrap">ชื่อกิจกรรม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap hidden sm:table-cell">ประเภท</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="font-thai text-right whitespace-nowrap hidden sm:table-cell">ผู้เข้าร่วม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium font-thai">
                      <div>
                        <p className="whitespace-nowrap">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.targetYear} / {a.targetSemester}</p>
                        <p className="text-xs text-gray-400 sm:hidden mt-0.5">
                          {CATEGORY_NAMES[a.category]} · {a._count.participations} คน
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs font-thai text-gray-600">{CATEGORY_NAMES[a.category]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[a.status]} border-0 font-thai text-xs whitespace-nowrap`}>
                        {STATUS_LABELS[a.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold text-gray-900">{a._count.participations}</span>
                        <span className="text-xs text-gray-400 font-thai">คน</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/activities/${a.id}`}>
                          <Button variant="outline" size="sm" className="font-thai gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">ดู</span>
                          </Button>
                        </Link>
                        <Link href={`/admin/activities/${a.id}/codes`}>
                          <Button variant="outline" size="sm" className="font-thai gap-1.5 text-primary-600 border-primary-200">
                            <Ticket className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">รหัส</span>
                          </Button>
                        </Link>
                        <Link href={`/admin/activities/${a.id}/edit`}>
                          <Button variant="outline" size="sm" className="font-thai gap-1.5 text-warning hover:bg-warning hover:text-white border-yellow-300">
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">แก้ไข</span>
                          </Button>
                        </Link>
                        <DeleteActivityButton id={a.id} name={a.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
