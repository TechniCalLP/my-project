import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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
import { Eye, Pencil } from "lucide-react"
import ToggleStudentStatusButton from "./toggle-student-status-button"

interface Student {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  year: string
  department: string
  email: string | null
  isActive: boolean
  _count: { participations: number }
}

interface StudentsTableProps {
  students: Student[]
}

export default function StudentsTable({ students }: StudentsTableProps) {
  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500 font-thai">
          ไม่พบนักศึกษา
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-thai">รหัสนักศึกษา</TableHead>
              <TableHead className="font-thai">ชื่อ-นามสกุล</TableHead>
              <TableHead className="font-thai">แผนก</TableHead>
              <TableHead className="font-thai">ระดับชั้น</TableHead>
              <TableHead className="font-thai text-right">กิจกรรม</TableHead>
              <TableHead className="font-thai">สถานะ</TableHead>
              <TableHead className="font-thai">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="hover:bg-gray-50">
                <TableCell className="font-mono">{student.studentId}</TableCell>

                <TableCell>
                  <p className="font-thai font-medium">
                    {student.prefix}{student.firstName} {student.lastName}
                  </p>
                  {student.email && (
                    <p className="text-xs text-gray-400">{student.email}</p>
                  )}
                </TableCell>

                <TableCell className="font-thai text-sm">{student.department}</TableCell>

                <TableCell>
                  <span className="font-thai text-sm">{student.year}</span>
                </TableCell>

                <TableCell className="text-right">
                  <span className="font-mono text-sm">{student._count.participations}</span>
                </TableCell>

                <TableCell>
                  {student.isActive ? (
                    <Badge className="bg-success/10 text-success border-0 font-thai text-xs">ใช้งาน</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-0 font-thai text-xs">ปิดใช้งาน</Badge>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/students/${student.id}`}>
                      <Button variant="ghost" size="sm" className="font-thai gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        ดู
                      </Button>
                    </Link>
                    <Link href={`/admin/students/${student.id}/edit`}>
                      <Button variant="ghost" size="sm" className="font-thai gap-1 text-warning">
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไข
                      </Button>
                    </Link>
                    <ToggleStudentStatusButton
                      studentId={student.id}
                      currentStatus={student.isActive}
                      studentName={`${student.firstName} ${student.lastName}`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
