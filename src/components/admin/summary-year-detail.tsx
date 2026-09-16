"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { toast } from "sonner"
import type { PartStatus } from "@/lib/evaluation"

interface SummaryYearDetailProps {
  year: string
  academicYear: string
  semester: string
  isAdminView: boolean
  clubId?: string
  activityId?: string
  activityName?: string
  hideActivityBanner?: boolean
  selectedIds?: Set<string>
  onToggleRow?: (row: StudentRow) => void
  onToggleAllVisible?: (rows: StudentRow[]) => void
}

export interface VocationalActivityResult {
  id: string
  name: string
  passThreshold: number
  score: number | null
  status: PartStatus
}

export interface StudentRow {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  department: string
  group: string | null
  year: string
  participation: { joined: number; total: number; progress: number; status: PartStatus }
  vocationalActivities: VocationalActivityResult[]
  overall: PartStatus
}

interface RowsData {
  rows: StudentRow[]
  total: number
  page: number
  totalPages: number
}

type StatusFilter = "all" | "pass" | "fail" | "pending"

function OverallBadge({ status }: { status: PartStatus }) {
  if (status === "PASS") return <Badge className="bg-success/10 text-success border-0 font-thai text-xs">ผ่าน</Badge>
  if (status === "FAIL") return <Badge className="bg-destructive/10 text-destructive border-0 font-thai text-xs">ไม่ผ่าน</Badge>
  return <Badge className="bg-gray-100 text-gray-500 border-0 font-thai text-xs">รอดำเนินการ</Badge>
}

export default function SummaryYearDetail({
  year,
  academicYear,
  semester,
  isAdminView,
  clubId,
  activityId,
  activityName,
  hideActivityBanner,
  selectedIds,
  onToggleRow,
  onToggleAllVisible,
}: SummaryYearDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectable = selectedIds !== undefined
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<RowsData | null>(null)
  const [loading, setLoading] = useState(false)

  const clearActivityFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("activity")
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year, academicYear, semester, search, status, page: String(page) })
      if (clubId) params.set("club", clubId)
      if (activityId) params.set("activity", activityId)
      const res = await fetch(`/api/admin/summary/students?${params.toString()}`)
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ")
      const json: RowsData = await res.json()
      setData(json)
    } catch {
      toast.error("โหลดข้อมูลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [year, academicYear, semester, clubId, activityId, search, status, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-4">
      {activityId && !hideActivityBanner && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5">
          <p className="text-sm font-thai text-primary-700">
            กำลังกรองสถานะตามกิจกรรม: <span className="font-semibold">{activityName ?? "-"}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={clearActivityFilter} className="gap-1 font-thai text-primary-700 hover:bg-primary-100">
            <X className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="ค้นหา รหัส, ชื่อ, นามสกุล"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 font-thai h-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as StatusFilter)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-40 font-thai h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-thai">ทั้งหมด</SelectItem>
                <SelectItem value="pass" className="font-thai">ผ่าน</SelectItem>
                <SelectItem value="fail" className="font-thai">ไม่ผ่าน</SelectItem>
                <SelectItem value="pending" className="font-thai">รอดำเนินการ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="py-12 text-center text-gray-400 font-thai flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังโหลด...
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-thai">ไม่พบนักศึกษา</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectable && (
                        <TableHead className="w-10">
                          <Checkbox
                            checked={data.rows.length > 0 && data.rows.every((r) => selectedIds!.has(r.id))}
                            onCheckedChange={() => onToggleAllVisible?.(data.rows)}
                            aria-label="เลือกทั้งหมด"
                          />
                        </TableHead>
                      )}
                      <TableHead className="font-thai whitespace-nowrap">รหัสนักศึกษา</TableHead>
                      <TableHead className="font-thai whitespace-nowrap">ชื่อ-นามสกุล</TableHead>
                      {isAdminView && <TableHead className="font-thai whitespace-nowrap">แผนก</TableHead>}
                      <TableHead className="font-thai whitespace-nowrap">กิจกรรมภาคบังคับ</TableHead>
                      <TableHead className="font-thai whitespace-nowrap">กิจกรรมองค์การวิชาชีพ</TableHead>
                      <TableHead className="font-thai whitespace-nowrap">ผลรวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        {selectable && (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds!.has(student.id)}
                              onCheckedChange={() => onToggleRow?.(student)}
                              aria-label={`เลือก ${student.prefix}${student.firstName} ${student.lastName}`}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-sm whitespace-nowrap">{student.studentId}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <p className="font-thai font-medium">
                            {student.prefix}{student.firstName} {student.lastName}
                          </p>
                          {student.group && <p className="text-xs text-gray-400 font-thai">กลุ่ม {student.group}</p>}
                        </TableCell>
                        {isAdminView && <TableCell className="font-thai text-sm whitespace-nowrap">{student.department}</TableCell>}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <OverallBadge status={student.participation.status} />
                            <span className="text-xs text-gray-400 font-mono">{student.participation.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const visibleActivities = activityId
                              ? student.vocationalActivities.filter((a) => a.id === activityId)
                              : student.vocationalActivities
                            return visibleActivities.length === 0 ? (
                              <span className="text-xs text-gray-400 font-thai">ไม่มีกิจกรรม</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {visibleActivities.map((a) => (
                                  <Badge
                                    key={a.id}
                                    variant="outline"
                                    className={`font-thai text-[11px] ${
                                      a.status === "PASS"
                                        ? "border-success/30 text-success"
                                        : a.status === "FAIL"
                                          ? "border-destructive/30 text-destructive"
                                          : "border-gray-300 text-gray-500"
                                    }`}
                                  >
                                    {a.name}: {a.score != null ? `${a.score}%` : "รอกรอก"}
                                  </Badge>
                                ))}
                              </div>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          <OverallBadge status={student.overall} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t">
                  <p className="text-xs text-gray-500 font-thai">
                    หน้า {data.page}/{data.totalPages} · ทั้งหมด {data.total} คน
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="gap-1 font-thai"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      ก่อนหน้า
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages || loading}
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      className="gap-1 font-thai"
                    >
                      ถัดไป
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
