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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-thai" style={{ width: "25%" }}>ชื่อกิจกรรม</TableHead>
                <TableHead className="font-thai" style={{ width: "16.67%" }}>ประเภท</TableHead>
                <TableHead className="font-thai" style={{ width: "16.67%" }}>สถานะ</TableHead>
                <TableHead className="font-thai text-right" style={{ width: "16.67%" }}>ผู้เข้าร่วม</TableHead>
                <TableHead className="font-thai" style={{ width: "25%" }}>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a) => (
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
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[a.status]} border-0 font-thai text-xs`}>
                      {STATUS_LABELS[a.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-900">{a._count.participations}</span>
                      <span className="text-xs text-gray-400 font-thai">คน</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/activities/${a.id}`}>
                        <Button variant="outline" size="sm" className="font-thai gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          ดู
                        </Button>
                      </Link>
                      <Link href={`/admin/activities/${a.id}/codes`}>
                        <Button variant="outline" size="sm" className="font-thai gap-1.5 text-primary-600 border-primary-200">
                          <Ticket className="w-3.5 h-3.5" />
                          รหัส
                        </Button>
                      </Link>
                      <Link href={`/admin/activities/${a.id}/edit`}>
                        <Button variant="outline" size="sm" className="font-thai gap-1.5 text-warning hover:bg-warning hover:text-white border-yellow-300">
                          <Pencil className="w-3.5 h-3.5" />
                          แก้ไข
                        </Button>
                      </Link>
                      <DeleteActivityButton id={a.id} name={a.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
