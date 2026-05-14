import { prisma } from "@/lib/prisma"
import StudentForm from "@/components/admin/student-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params

  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/admin/students/${id}`}>
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">แก้ไขข้อมูลนักศึกษา</h1>
        <p className="text-gray-500 font-thai mt-1">
          {student.firstName} {student.lastName} ({student.studentId})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลนักศึกษา</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm initialData={student} isEdit />
        </CardContent>
      </Card>
    </div>
  )
}
