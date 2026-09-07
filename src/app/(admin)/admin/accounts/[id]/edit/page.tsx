import { prisma } from "@/lib/prisma"
import AccountForm from "@/components/admin/account-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditAccountPage({ params }: PageProps) {
  const { id } = await params

  const [account, departments] = await Promise.all([
    prisma.admin.findUnique({ where: { id } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  if (!account) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/accounts">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">แก้ไขบัญชีผู้ใช้</h1>
        <p className="text-gray-500 font-thai mt-1">{account.name} ({account.username})</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลบัญชี</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm departments={departments} initialData={account} isEdit />
        </CardContent>
      </Card>
    </div>
  )
}
