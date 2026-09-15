import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus } from "lucide-react"
import { Suspense } from "react"
import SignatureFilters from "@/components/admin/signature-filters"
import SignatureFormDialog from "@/components/admin/signature-form-dialog"
import SignatureRowActions from "@/components/admin/signature-row-actions"
import { PaginationNav } from "@/components/ui/pagination-nav"

const ITEMS_PER_PAGE = 10

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? "1"))
  const search = params.search?.trim() ?? ""
  const status = params.status === "active" || params.status === "inactive" ? params.status : "all"

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { position: { contains: search } },
          ],
        }
      : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
  }

  const [total, signatures] = await Promise.all([
    prisma.documentSignature.count({ where }),
    prisma.documentSignature.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
  ])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">ตั้งค่าระบบ</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">ตั้งค่าที่ใช้ร่วมกันทั้งระบบ</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-thai text-base">รายการลายเซ็นสำหรับเอกสาร</CardTitle>
            <p className="text-sm text-gray-500 font-thai mt-1">
              ลายเซ็นดิจิทัลสำหรับประทับบนเอกสารสำคัญ ใบรับรอง และรายงานผลการเรียนหลักสูตรวิชาชีพ
              รายการที่ &ldquo;กำลังใช้งานหลัก&rdquo; จะถูกใส่อัตโนมัติในใบ Export PDF อวท.15 / อวท.17 ทุกใบ
            </p>
          </div>
          <SignatureFormDialog
            mode="create"
            trigger={
              <Button className="font-thai gap-1.5 shrink-0">
                <Plus className="w-4 h-4" />
                เพิ่มข้อมูล
              </Button>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense>
            <SignatureFilters />
          </Suspense>

          {signatures.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-thai border rounded-lg">
              {total === 0 && search === "" && status === "all" ? "ยังไม่มีรายการลายเซ็น" : "ไม่พบรายการตามเงื่อนไขที่เลือก"}
            </div>
          ) : (
            <div className="space-y-3">
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="flex flex-wrap items-center justify-between gap-4 border rounded-lg p-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-14 shrink-0 border rounded-md bg-gray-50 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sig.imageData} alt={sig.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-thai font-semibold truncate">{sig.name}</p>
                        {sig.isActive ? (
                          <Badge className="bg-success/10 text-success border-0 font-thai text-xs shrink-0">กำลังใช้งานหลัก</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 font-thai text-xs shrink-0">ปิดการใช้งาน</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 font-thai truncate">{sig.position}</p>
                      <p className="text-xs text-gray-400 font-thai mt-0.5">
                        อัปเดตเมื่อ: {sig.updatedAt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <SignatureRowActions signature={sig} />
                </div>
              ))}
            </div>
          )}

          <Suspense>
            <PaginationNav currentPage={currentPage} totalPages={totalPages} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
