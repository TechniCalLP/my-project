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
import { Plus, Pencil, Users2 } from "lucide-react"
import Link from "next/link"
import { DeleteClubButton } from "@/components/admin/delete-club-button"

// This page has no per-request dynamic API (searchParams/cookies), so
// Next.js would otherwise prerender it once at build time and keep
// serving that stale club list forever — force it to always refetch.
export const dynamic = "force-dynamic"

export default async function ClubsPage() {
  const clubs = await prisma.club.findMany({
    include: { departments: true, _count: { select: { admins: true, activities: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary-600" />
            <h1 className="text-xl md:text-2xl font-bold font-thai">การจัดการชมรมวิชาชีพ</h1>
          </div>
          <p className="text-gray-500 font-thai mt-1 text-sm">
            รวมหลายแผนกเข้าเป็นชมรมเดียว ผูกกับบัญชีอาจารย์ประจำชมรมได้
          </p>
        </div>
        <Link href="/admin/clubs/create">
          <Button className="font-thai gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มชมรม
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai whitespace-nowrap">ชื่อชมรม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">แผนกในชมรม</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">จำนวนอาจารย์</TableHead>
                  <TableHead className="font-thai text-right whitespace-nowrap">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 font-thai py-8">
                      ยังไม่มีชมรม
                    </TableCell>
                  </TableRow>
                ) : (
                  clubs.map((club) => (
                    <TableRow key={club.id} className="hover:bg-gray-50">
                      <TableCell className="font-thai font-medium whitespace-nowrap">{club.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {club.departments.map((d) => (
                            <Badge key={d.id} variant="outline" className="font-thai text-xs whitespace-nowrap">
                              {d.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{club._count.admins}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/clubs/${club.id}/edit`}>
                            <Button variant="ghost" size="sm" className="gap-1 font-thai">
                              <Pencil className="w-3.5 h-3.5" />
                              แก้ไข
                            </Button>
                          </Link>
                          <DeleteClubButton id={club.id} name={club.name} />
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
