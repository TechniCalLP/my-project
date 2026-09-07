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

interface Student {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  year: string
  group: string | null
  email: string | null
  isActive: boolean
  _count: { participations: number }
}

interface TeacherStudentsTableProps {
  students: Student[]
}

export default function TeacherStudentsTable({ students }: TeacherStudentsTableProps) {
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
                <TableHead className="font-thai whitespace-nowrap hidden lg:table-cell">กลุ่ม</TableHead>
                <TableHead className="font-thai whitespace-nowrap hidden sm:table-cell">ระดับชั้น</TableHead>
                <TableHead className="font-thai text-right whitespace-nowrap hidden sm:table-cell">กิจกรรม</TableHead>
                <TableHead className="font-thai whitespace-nowrap">สถานะ</TableHead>
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
                    <p className="text-xs text-gray-400 font-thai sm:hidden mt-0.5">{student.year}</p>
                    {student.email && (
                      <p className="text-xs text-gray-400 hidden md:block">{student.email}</p>
                    )}
                  </TableCell>

                  <TableCell className="font-thai text-sm hidden lg:table-cell">{student.group ?? "-"}</TableCell>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
