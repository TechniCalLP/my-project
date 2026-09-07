import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Building2 } from "lucide-react"
import Link from "next/link"
import { DeleteDepartmentButton } from "@/components/admin/delete-department-button"

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: { _count: { select: { admins: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl md:text-2xl font-bold font-thai">จัดการแผนก</h1>
          </div>
          <p className="text-gray-500 font-thai mt-1 text-sm">รายชื่อแผนกที่ใช้ผูกกับบัญชีอาจารย์</p>
        </div>
        <Link href="/admin/departments/create">
          <Button className="font-thai gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มแผนก
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-thai">ชื่อแผนก</TableHead>
                <TableHead className="font-thai">ชื่อเรียกอื่น</TableHead>
                <TableHead className="font-thai">จำนวนอาจารย์ที่ผูกไว้</TableHead>
                <TableHead className="font-thai text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-thai font-medium">{dept.name}</TableCell>
                  <TableCell className="font-thai text-sm text-gray-500">
                    {dept.aliases.length > 0 ? dept.aliases.join(", ") : "—"}
                  </TableCell>
                  <TableCell>{dept._count.admins}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/departments/${dept.id}/edit`}>
                        <Button variant="ghost" size="sm" className="gap-1 font-thai">
                          <Pencil className="w-3.5 h-3.5" />
                          แก้ไข
                        </Button>
                      </Link>
                      <DeleteDepartmentButton id={dept.id} name={dept.name} />
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
