import { prisma } from "@/lib/prisma"
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
import { ArrowLeft, Mail, Phone, Pencil } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import ResetPasswordButton from "@/components/admin/reset-password-button"
import { CATEGORY_NAMES } from "@/lib/constants"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      participations: {
        include: { activity: true },
        orderBy: { joinedAt: "desc" },
      },
    },
  })

  if (!student) notFound()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/students">
            <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-thai">
            {student.prefix}{student.firstName} {student.lastName}
          </h1>
          <p className="text-gray-500 font-mono mt-1">รหัสนักศึกษา: {student.studentId}</p>
        </div>
        <div className="flex gap-2">
          <ResetPasswordButton
            studentId={student.id}
            studentName={`${student.firstName} ${student.lastName}`}
          />
          <Link href={`/admin/students/${id}/edit`}>
            <Button className="font-thai gap-2">
              <Pencil className="w-4 h-4" />
              แก้ไข
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-thai">รหัสนักศึกษา</p>
              <p className="font-mono mt-0.5">{student.studentId}</p>
            </div>
            <div>
              <p className="text-gray-500 font-thai">สถานะ</p>
              <div className="mt-0.5">
                {student.isActive ? (
                  <Badge className="bg-success/10 text-success border-0 font-thai text-xs">ใช้งาน</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 border-0 font-thai text-xs">ปิดการใช้งาน</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-500 font-thai">แผนก</p>
              <p className="font-thai mt-0.5">{student.department}</p>
            </div>
            <div>
              <p className="text-gray-500 font-thai">ระดับชั้น</p>
              <p className="font-thai mt-0.5">{student.year}</p>
            </div>
            {student.email && (
              <div>
                <p className="text-gray-500 font-thai">อีเมล</p>
                <p className="flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {student.email}
                </p>
              </div>
            )}
            {student.phone && (
              <div>
                <p className="text-gray-500 font-thai">เบอร์โทร</p>
                <p className="flex items-center gap-1 font-mono mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {student.phone}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">
            ประวัติการเข้าร่วมกิจกรรม ({student.participations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.participations.length === 0 ? (
            <p className="text-center text-gray-500 py-8 font-thai">ยังไม่มีการเข้าร่วมกิจกรรม</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai">ชื่อกิจกรรม</TableHead>
                  <TableHead className="font-thai">ประเภท</TableHead>
                  <TableHead className="font-thai">ปีการศึกษา</TableHead>
                  <TableHead className="font-thai">วันที่เข้าร่วม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.participations.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-thai font-medium">{p.activity.name}</TableCell>
                    <TableCell>
                      <span className="text-xs font-thai text-gray-600">
                        {CATEGORY_NAMES[p.activity.category]}
                      </span>
                    </TableCell>
                    <TableCell className="font-thai text-sm">
                      {p.activity.targetYear} / {p.activity.targetSemester}
                    </TableCell>
                    <TableCell className="font-thai text-sm">
                      {new Date(p.joinedAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
