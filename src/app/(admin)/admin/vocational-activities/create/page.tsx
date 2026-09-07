import { prisma } from "@/lib/prisma"
import VocationalActivityForm from "@/components/admin/vocational-activity-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{ copyFrom?: string }>
}

export default async function CreateVocationalActivityPage({ searchParams }: PageProps) {
  const { copyFrom } = await searchParams

  const [departments, source] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    copyFrom
      ? prisma.vocationalActivity.findUnique({ where: { id: copyFrom }, include: { departments: true } })
      : null,
  ])

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/vocational-activities">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">เพิ่มกิจกรรมองค์การวิชาชีพ</h1>
        <p className="text-gray-500 font-thai mt-1">
          {source
            ? `คัดลอกข้อมูลจาก "${source.name}" — แก้ไขแล้วบันทึกเป็นกิจกรรมใหม่ได้เลย`
            : "กำหนดกิจกรรมที่อาจารย์แผนกที่เลือกจะต้องประเมินคะแนนนักศึกษา"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลกิจกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          <VocationalActivityForm departments={departments} initialData={source ?? undefined} />
        </CardContent>
      </Card>
    </div>
  )
}
