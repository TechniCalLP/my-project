import { prisma } from "@/lib/prisma"
import DepartmentForm from "@/components/admin/department-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditDepartmentPage({ params }: PageProps) {
  const { id } = await params

  const department = await prisma.department.findUnique({ where: { id } })
  if (!department) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/departments">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">แก้ไขแผนก</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลแผนก</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentForm initialData={department} isEdit />
        </CardContent>
      </Card>
    </div>
  )
}
