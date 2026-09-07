import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, UserCog } from "lucide-react"
import Link from "next/link"
import { ADMIN_ROLE_NAMES } from "@/lib/constants"
import AccountResetPasswordButton from "@/components/admin/account-reset-password-button"
import { DeleteAccountButton } from "@/components/admin/delete-account-button"

export default async function AccountsPage() {
  const accounts = await prisma.admin.findMany({
    include: { department: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl md:text-2xl font-bold font-thai">จัดการบัญชีผู้ใช้</h1>
          </div>
          <p className="text-gray-500 font-thai mt-1 text-sm">สร้างและจัดการบัญชีผู้ดูแลระบบและอาจารย์</p>
        </div>
        <Link href="/admin/accounts/create">
          <Button className="font-thai gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มบัญชี
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-thai">ชื่อผู้ใช้</TableHead>
                <TableHead className="font-thai">ชื่อ-นามสกุล</TableHead>
                <TableHead className="font-thai">บทบาท</TableHead>
                <TableHead className="font-thai">แผนก</TableHead>
                <TableHead className="font-thai text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">{account.username}</TableCell>
                  <TableCell className="font-thai">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant={account.role === "SUPER_ADMIN" ? "default" : "outline"} className="font-thai">
                      {ADMIN_ROLE_NAMES[account.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-thai text-sm text-gray-500">
                    {account.department?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <AccountResetPasswordButton accountId={account.id} accountName={account.name} />
                      <Link href={`/admin/accounts/${account.id}/edit`}>
                        <Button variant="ghost" size="sm" className="gap-1 font-thai">
                          <Pencil className="w-3.5 h-3.5" />
                          แก้ไข
                        </Button>
                      </Link>
                      <DeleteAccountButton id={account.id} name={account.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
