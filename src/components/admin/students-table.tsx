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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-thai whitespace-nowrap">รหัสนักศึกษา</TableHead>
                <TableHead className="font-thai whitespace-nowrap">ชื่อ-นามสกุล</TableHead>
                <TableHead className="font-thai whitespace-nowrap hidden md:table-cell">แผนก</TableHead>
                <TableHead className="font-thai whitespace-nowrap hidden sm:table-cell">ระดับชั้น</TableHead>
                <TableHead className="font-thai text-right whitespace-nowrap hidden sm:table-cell">กิจกรรม</TableHead>
                <TableHead className="font-thai whitespace-nowrap">สถานะ</TableHead>
                <TableHead className="font-thai whitespace-nowrap">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{student.studentId}</TableCell>

                  <TableCell>
                    <p className="font-thai font-medium whitespace-nowrap">
                      {student.prefix}{student.firstName} {student.lastName}
                    </p>
                    {/* Show year/dept inline on mobile */}
                    <p className="text-xs text-gray-400 font-thai sm:hidden mt-0.5">
                      {student.year} · {student.department}
                    </p>
                    {student.email && (
                      <p className="text-xs text-gray-400 hidden md:block">{student.email}</p>
                    )}
                  </TableCell>

                  <TableCell className="font-thai text-sm hidden md:table-cell">{student.department}</TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <span className="font-thai text-sm">{student.year}</span>
                  </TableCell>

                  <TableCell className="text-right hidden sm:table-cell">
                    <span className="font-mono text-sm">{student._count.participations}</span>
                  </TableCell>

                  <TableCell>
                    {student.isActive ? (
                      <Badge className="bg-success/10 text-success border-0 font-thai text-xs whitespace-nowrap">ใช้งาน</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-0 font-thai text-xs whitespace-nowrap">ปิดใช้งาน</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/students/${student.id}`}>
                        <Button variant="ghost" size="sm" className="font-thai gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">ดู</span>
                        </Button>
                      </Link>
                      <Link href={`/admin/students/${student.id}/edit`}>
                        <Button variant="ghost" size="sm" className="font-thai gap-1 text-warning">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">แก้ไข</span>
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
        </div>
      </CardContent>
    </Card>
  )
}
