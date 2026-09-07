import { prisma } from "@/lib/prisma"
import VocationalActivityForm from "@/components/admin/vocational-activity-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditVocationalActivityPage({ params }: PageProps) {
  const { id } = await params

  const [activity, departments] = await Promise.all([
    prisma.vocationalActivity.findUnique({ where: { id }, include: { departments: true } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  if (!activity) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/vocational-activities">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">แก้ไขกิจกรรมองค์การวิชาชีพ</h1>
        <p className="text-gray-500 font-thai mt-1">{activity.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลกิจกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          <VocationalActivityForm departments={departments} initialData={activity} isEdit />
        </CardContent>
      </Card>
    </div>
  )
}
