import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { YEARS, DEPARTMENTS } from "@/lib/constants"

interface PageProps {
  searchParams: Promise<{
    search?: string
    year?: string
    department?: string
  }>
}

export default async function AdminStudentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const params = await searchParams

  const where: Record<string, unknown> = {}
  if (params.year) where.year = params.year
  if (params.department) where.department = params.department
  if (params.search) {
    where.OR = [
      { studentId: { contains: params.search } },
      { firstName: { contains: params.search } },
      { lastName: { contains: params.search } },
    ]
  }

  const students = await prisma.student.findMany({
    where,
    include: { _count: { select: { participations: true } } },
    orderBy: { studentId: "asc" },
  })

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold font-thai">จัดการนักศึกษา</h1>

      <form method="GET" className="flex flex-wrap gap-3">
        <Input
          name="search"
          defaultValue={params.search}
          placeholder="ค้นหาด้วยรหัสหรือชื่อ..."
          className="w-56 font-thai"
        />
        <Select name="year" defaultValue={params.year ?? "all"}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="ระดับชั้น" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-thai">ทุกระดับ</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y} className="font-thai">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="department" defaultValue={params.department ?? "all"}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="แผนก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-thai">ทุกแผนก</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d} className="font-thai">{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-thai hover:bg-primary-600"
        >
          ค้นหา
        </button>
        <a href="/admin/students" className="px-4 py-2 border rounded-md text-sm font-thai hover:bg-gray-50">
          ล้าง
        </a>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-base">นักศึกษา {students.length} คน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-thai">รหัสนักศึกษา</TableHead>
                <TableHead className="font-thai">ชื่อ-นามสกุล</TableHead>
                <TableHead className="font-thai">ระดับชั้น</TableHead>
                <TableHead className="font-thai">แผนก</TableHead>
                <TableHead className="font-thai text-right">กิจกรรมที่เข้าร่วม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 font-thai py-8">
                    ไม่พบนักศึกษา
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.studentId}</TableCell>
                    <TableCell className="font-thai">{s.firstName} {s.lastName}</TableCell>
                    <TableCell className="font-thai">{s.year}</TableCell>
                    <TableCell className="font-thai">{s.department}</TableCell>
                    <TableCell className="text-right">{s._count.participations}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
