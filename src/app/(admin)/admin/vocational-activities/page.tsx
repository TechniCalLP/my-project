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
import { Plus, Pencil, Copy, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import VocationalActivityFilters from "@/components/admin/vocational-activity-filters"
import { DeleteVocationalActivityButton } from "@/components/admin/delete-vocational-activity-button"

interface PageProps {
  searchParams: Promise<{ search?: string; academicYear?: string }>
}

export default async function VocationalActivitiesPage({ searchParams }: PageProps) {
  const params = await searchParams

  const where: Record<string, unknown> = {}
  if (params.search) where.name = { contains: params.search, mode: "insensitive" }
  if (params.academicYear) where.academicYear = params.academicYear

  const activities = await prisma.vocationalActivity.findMany({
    where,
    include: { departments: true, _count: { select: { scores: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl md:text-2xl font-bold font-thai">กิจกรรมองค์การวิชาชีพ</h1>
          </div>
          <p className="text-gray-500 font-thai mt-1 text-sm">กำหนดรายการกิจกรรมที่ให้อาจารย์แต่ละแผนกประเมินคะแนนนักศึกษา</p>
        </div>
        <Link href="/admin/vocational-activities/create">
          <Button className="font-thai gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มกิจกรรม
          </Button>
        </Link>
      </div>

      <Suspense>
        <VocationalActivityFilters />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai whitespace-nowrap">ชื่อกิจกรรม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">ปีการศึกษา / ภาคเรียน</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">ชั้นปี</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">แผนก</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">เกณฑ์ผ่าน</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">คะแนนที่กรอกแล้ว</TableHead>
                  <TableHead className="font-thai text-right whitespace-nowrap">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 font-thai py-8">
                      {params.search ? `ไม่พบกิจกรรมที่ค้นหา "${params.search}"` : "ยังไม่มีกิจกรรม"}
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((a) => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell className="font-thai font-medium whitespace-nowrap">{a.name}</TableCell>
                      <TableCell className="font-thai text-sm whitespace-nowrap">
                        {a.academicYear} / {a.semester}
                      </TableCell>
                      <TableCell className="font-thai text-sm whitespace-nowrap">
                        {a.targetYears.length === 0 ? "ทุกชั้นปี" : a.targetYears.join(", ")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {a.departments.map((d) => (
                            <Badge key={d.id} variant="outline" className="font-thai text-xs whitespace-nowrap">
                              {d.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{a.passThreshold}%</TableCell>
                      <TableCell className="font-mono text-sm">{a._count.scores}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/vocational-activities/create?copyFrom=${a.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1 font-thai">
                              <Copy className="w-3.5 h-3.5" />
                              คัดลอก
                            </Button>
                          </Link>
                          <Link href={`/admin/vocational-activities/${a.id}/edit`}>
                            <Button variant="ghost" size="sm" className="gap-1 font-thai">
                              <Pencil className="w-3.5 h-3.5" />
                              แก้ไข
                            </Button>
                          </Link>
                          <DeleteVocationalActivityButton id={a.id} name={a.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
