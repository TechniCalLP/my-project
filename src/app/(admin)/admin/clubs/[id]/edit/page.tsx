import { prisma } from "@/lib/prisma"
import ClubForm from "@/components/admin/club-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditClubPage({ params }: PageProps) {
  const { id } = await params

  const [club, departments] = await Promise.all([
    prisma.club.findUnique({ where: { id }, include: { departments: true } }),
    prisma.department.findMany({
      where: { isActive: true },
      include: { clubs: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  if (!club) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/clubs">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">แก้ไขชมรมวิชาชีพ</h1>
        <p className="text-gray-500 font-thai mt-1">{club.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลชมรม</CardTitle>
        </CardHeader>
        <CardContent>
          <ClubForm departments={departments} initialData={club} isEdit />
        </CardContent>
      </Card>
    </div>
  )
}
