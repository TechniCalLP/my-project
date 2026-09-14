import { prisma } from "@/lib/prisma"
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
import { FileEdit } from "lucide-react"
import { CorrectionRequestActions } from "@/components/admin/correction-request-actions"

const STATUS_LABELS = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
} as const

const STATUS_COLORS = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-success/10 text-success",
  REJECTED: "bg-secondary-100 text-secondary-700",
} as const

export default async function CorrectionRequestsPage() {
  const requests = await prisma.vocationalScoreCorrectionRequest.findMany({
    include: {
      vocationalActivity: { select: { name: true, academicYear: true, semester: true } },
      student: { select: { studentId: true, prefix: true, firstName: true, lastName: true, department: true } },
      requestedBy: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">คำขอแก้ไขคะแนน</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">
          คำขอแก้ไขคะแนนกิจกรรมองค์การวิชาชีพที่ถูกบันทึกฉบับสมบูรณ์แล้ว จากอาจารย์ประจำชมรม
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai whitespace-nowrap">นักศึกษา</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">กิจกรรม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">คะแนนเดิม → ที่ขอแก้</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">เหตุผล</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">ผู้ขอ</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="font-thai text-right whitespace-nowrap">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 font-thai py-8">
                      ยังไม่มีคำขอแก้ไขคะแนน
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow key={r.id} className="hover:bg-gray-50">
                      <TableCell className="font-thai whitespace-nowrap">
                        <p className="font-medium">{r.student.prefix}{r.student.firstName} {r.student.lastName}</p>
                        <p className="text-xs text-gray-400 font-mono">{r.student.studentId}</p>
                      </TableCell>
                      <TableCell className="font-thai text-sm whitespace-nowrap">
                        {r.vocationalActivity.name}
                        <p className="text-xs text-gray-400">
                          {r.vocationalActivity.academicYear} / {r.vocationalActivity.semester}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {r.currentScore} → {r.proposedScore}
                      </TableCell>
                      <TableCell className="font-thai text-sm max-w-xs">{r.reason}</TableCell>
                      <TableCell className="font-thai text-sm whitespace-nowrap">{r.requestedBy.name}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[r.status]} border-0 font-thai text-xs whitespace-nowrap`}>
                          {STATUS_LABELS[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === "PENDING" ? (
                          <CorrectionRequestActions id={r.id} />
                        ) : (
                          <span className="text-xs text-gray-400 font-thai">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
