import { prisma } from "@/lib/prisma"
import AccountForm from "@/components/admin/account-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Fetches the clubs list for the dropdown with no per-request dynamic API,
// so Next.js would otherwise prerender it once at build time and keep
// showing stale clubs (missing anything created after the last deploy).
export const dynamic = "force-dynamic"

export default async function CreateAccountPage() {
  const clubs = await prisma.club.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/accounts">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">เพิ่มบัญชีผู้ใช้</h1>
        <p className="text-gray-500 font-thai mt-1">สร้างบัญชีผู้ดูแลระบบ หรืออาจารย์ประจำชมรม</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลบัญชี</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountForm clubs={clubs} />
        </CardContent>
      </Card>
    </div>
  )
}
