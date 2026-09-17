import { prisma } from "@/lib/prisma"
import ClubForm from "@/components/admin/club-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CreateClubPage() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    include: { clubs: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/clubs">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">เพิ่มชมรมวิชาชีพ</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลชมรม</CardTitle>
        </CardHeader>
        <CardContent>
          <ClubForm departments={departments} />
        </CardContent>
      </Card>
    </div>
  )
}
