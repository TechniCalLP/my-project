"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActivityForm } from "@/components/forms/activity-form"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileOutput, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from "lucide-react"

const PARTICIPANTS_PER_PAGE = 10

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  ACADEMIC: "bg-primary-100 text-primary-700",
  COMMUNITY_SERVICE: "bg-success/10 text-success",
  HEALTH: "bg-secondary-100 text-secondary-700",
  SCOUT: "bg-yellow-100 text-yellow-700",
}

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
  description?: string | null
  category: ActivityCategory
  targetYear: string
  targetSemester: string
  targetDepartments: string[]
  startDate: string
  endDate: string
  location?: string | null
  maxSlots?: number | null
  status: ActivityStatus
  createdAt: string
  participations: Array<{
    id: string
    joinedAt: string
    student: {
      id: string
      studentId: string
      firstName: string
      lastName: string
      year: string
      department: string
    }
  }>
}

export default function ActivityDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [participantsPage, setParticipantsPage] = useState(1)

  const fetchActivity = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/activities/${params.id}`)
      if (!res.ok) { router.push("/admin/activities"); return }
      setActivity(await res.json())
      setParticipantsPage(1)
    } catch {
      router.push("/admin/activities")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchActivity() }, [params.id])

  const handleDelete = async () => {
    if (!confirm("ยืนยันการลบกิจกรรมนี้?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/activities/${params.id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("ไม่สามารถลบกิจกรรมได้"); return }
      toast.success("ลบกิจกรรมสำเร็จ")
      router.push("/admin/activities")
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!activity) return null

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/activities" className="text-sm text-gray-500 hover:text-gray-700 font-thai">
            ← กลับ
          </Link>
          <h1 className="text-2xl font-bold font-thai mt-1">{activity.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-thai gap-2">
                <FileOutput className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-thai">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/export/activities/${params.id}`)
                    if (!res.ok) throw new Error("Download failed")
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement("a")
                    link.href = url
                    const disposition = res.headers.get("Content-Disposition") ?? ""
                    const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
                    link.download = match ? decodeURIComponent(match[1]) : "export.xlsx"
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    toast.success("ดาวน์โหลด Excel สำเร็จ")
                  } catch {
                    toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่")
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => {
                  window.open(`/admin/print/activities/${params.id}`, "_blank")
                  toast.success("เปิดหน้า PDF แล้ว")
                }}
              >
                <FileText className="w-4 h-4 text-red-500" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href={`/admin/activities/${params.id}/codes`}>
            <Button variant="outline" className="font-thai">จัดการรหัส</Button>
          </Link>
          <Button variant="outline" onClick={() => setEditOpen(true)} className="font-thai">
            แก้ไข
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="font-thai">
            {deleting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลกิจกรรม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Badge className={`${CATEGORY_COLORS[activity.category]} border-0 font-thai`}>
              {CATEGORY_NAMES[activity.category]}
            </Badge>
            <Badge className={`${STATUS_COLORS[activity.status]} border-0 font-thai`}>
              {STATUS_LABELS[activity.status]}
            </Badge>
          </div>
          {activity.description && (
            <p className="text-gray-600 font-thai">{activity.description}</p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-thai">ระดับชั้น: </span>
              <span className="font-thai">{activity.targetYear}</span>
            </div>
            <div>
              <span className="text-gray-500 font-thai">ภาคเรียน: </span>
              <span className="font-thai">{activity.targetSemester}</span>
            </div>
            <div>
              <span className="text-gray-500 font-thai">วันเริ่มต้น: </span>
              <span className="font-thai">{new Date(activity.startDate).toLocaleDateString("th-TH")}</span>
            </div>
            <div>
              <span className="text-gray-500 font-thai">วันสิ้นสุด: </span>
              <span className="font-thai">{new Date(activity.endDate).toLocaleDateString("th-TH")}</span>
            </div>
            {activity.location && (
              <div>
                <span className="text-gray-500 font-thai">สถานที่: </span>
                <span className="font-thai">{activity.location}</span>
              </div>
            )}
            {activity.maxSlots && (
              <div>
                <span className="text-gray-500 font-thai">ที่นั่งสูงสุด: </span>
                <span>{activity.maxSlots}</span>
              </div>
            )}
          </div>
          {activity.targetDepartments.length > 0 && (
            <div>
              <span className="text-gray-500 text-sm font-thai">แผนก: </span>
              <span className="text-sm font-thai">{activity.targetDepartments.join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">
            ผู้เข้าร่วม ({activity.participations.length} คน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.participations.length === 0 ? (
            <p className="text-center text-gray-500 py-8 font-thai">ยังไม่มีผู้เข้าร่วม</p>
          ) : (() => {
            const totalParticipantPages = Math.ceil(activity.participations.length / PARTICIPANTS_PER_PAGE)
            const paginated = activity.participations.slice(
              (participantsPage - 1) * PARTICIPANTS_PER_PAGE,
              participantsPage * PARTICIPANTS_PER_PAGE
            )
            return (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-thai">รหัสนักศึกษา</TableHead>
                      <TableHead className="font-thai">ชื่อ-นามสกุล</TableHead>
                      <TableHead className="font-thai">ระดับชั้น</TableHead>
                      <TableHead className="font-thai">แผนก</TableHead>
                      <TableHead className="font-thai">วันที่เข้าร่วม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.student.studentId}</TableCell>
                        <TableCell className="font-thai">{p.student.firstName} {p.student.lastName}</TableCell>
                        <TableCell className="font-thai">{p.student.year}</TableCell>
                        <TableCell className="font-thai">{p.student.department}</TableCell>
                        <TableCell className="font-thai">
                          {new Date(p.joinedAt).toLocaleDateString("th-TH")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalParticipantPages > 1 && (
                  <div className="flex flex-col items-center gap-2 pt-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setParticipantsPage((p) => p - 1)}
                        disabled={participantsPage === 1}
                        className="font-thai gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        ก่อนหน้า
                      </Button>
                      {Array.from({ length: totalParticipantPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={participantsPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setParticipantsPage(page)}
                          className="w-9 h-9"
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setParticipantsPage((p) => p + 1)}
                        disabled={participantsPage === totalParticipantPages}
                        className="font-thai gap-1"
                      >
                        ถัดไป
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 font-thai">
                      แสดง {(participantsPage - 1) * PARTICIPANTS_PER_PAGE + 1}–{Math.min(participantsPage * PARTICIPANTS_PER_PAGE, activity.participations.length)} จาก {activity.participations.length} คน
                    </p>
                  </div>
                )}
              </>
            )
          })()}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-thai">แก้ไขกิจกรรม</DialogTitle>
          </DialogHeader>
          <ActivityForm
            activity={activity}
            onSuccess={() => {
              setEditOpen(false)
              fetchActivity()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
