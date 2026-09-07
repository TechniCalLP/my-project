"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronUp, Save, FileText, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface ActivityColumn {
  id: string
  name: string
  passThreshold: number
}

interface ScoreCell {
  score: number | null
  isDraft: boolean
}

interface StudentRow {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  group: string | null
  scores: Record<string, ScoreCell>
}

interface EvalData {
  activities: ActivityColumn[]
  rows: StudentRow[]
  total: number
  page: number
  totalPages: number
}

interface GradeEvaluationCardProps {
  year: string
  academicYear: string
  semester: string
  total: number
  filled: number
  groupCount: number
  activityNames: string[]
}

type StatusFilter = "all" | "filled" | "unfilled"
type Entry = { studentId: string; activityId: string; score: number }

export default function GradeEvaluationCard({
  year,
  academicYear,
  semester,
  total,
  filled,
  groupCount,
  activityNames,
}: GradeEvaluationCardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<EvalData | null>(null)
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [confirmEntries, setConfirmEntries] = useState<Entry[] | null>(null)

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
      const res = await fetch(`/api/teacher/evaluation?${params.toString()}`)
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ")
      const json: EvalData = await res.json()
      setData(json)
      setValues(
        Object.fromEntries(
          json.rows.map((r) => [
            r.id,
            Object.fromEntries(json.activities.map((a) => [a.id, r.scores[a.id]?.score?.toString() ?? ""])),
          ])
        )
      )
    } catch {
      toast.error("โหลดข้อมูลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [year, academicYear, semester, search, status, page])

  useEffect(() => {
    if (open) fetchData()
  }, [open, fetchData])

  const setValue = (studentId: string, activityId: string, value: string) => {
    setValues((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [activityId]: value } }))
  }

  const collectEntries = (): Entry[] | null => {
    if (!data) return null
    const entries: Entry[] = []
    for (const row of data.rows) {
      for (const a of data.activities) {
        const raw = values[row.id]?.[a.id]
        if (raw === undefined || raw === "") continue
        const num = Number(raw)
        if (Number.isNaN(num) || num < 0 || num > 100) {
          toast.error(`คะแนน "${a.name}" ของ ${row.prefix}${row.firstName} ${row.lastName} ต้องอยู่ระหว่าง 0-100`)
          return null
        }
        entries.push({ studentId: row.id, activityId: a.id, score: num })
      }
    }
    if (entries.length === 0) {
      toast.error("กรุณากรอกคะแนนอย่างน้อย 1 ช่อง")
      return null
    }
    return entries
  }

  const submitEntries = async (entries: Entry[], isDraft: boolean) => {
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/vocational-activities/bulk-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: entries.map((e) => ({ activityId: e.activityId, studentId: e.studentId, score: e.score })),
          isDraft,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      toast.success(isDraft ? `บันทึกฉบับร่างแล้ว ${entries.length} รายการ` : `บันทึกคะแนนแล้ว ${entries.length} รายการ`)
      await fetchData()
      if (!isDraft) router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    const entries = collectEntries()
    if (!entries) return
    submitEntries(entries, true)
  }

  const handleSaveFinal = () => {
    if (!data) return
    const entries = collectEntries()
    if (!entries) return

    const wasCompleteBefore = (row: StudentRow) =>
      data.activities.every((a) => row.scores[a.id]?.score != null && row.scores[a.id]?.isDraft === false)
    const willBeCompleteAfter = (row: StudentRow) =>
      data.activities.every((a) => {
        const typed = values[row.id]?.[a.id]
        if (typed !== undefined && typed !== "") return true
        const existing = row.scores[a.id]
        return existing?.score != null && existing?.isDraft === false
      })
    const newlyCompleted = data.rows.filter((r) => !wasCompleteBefore(r) && willBeCompleteAfter(r)).length
    const predictedFilled = filled + newlyCompleted

    if (total > 0 && predictedFilled === total) {
      setConfirmEntries(entries)
      return
    }
    submitEntries(entries, false)
  }

  const filledLabel = filled === total && total > 0 ? "กรอกแล้ว" : "รอดำเนินการ"

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-thai font-semibold text-base">{activityNames.join(", ")}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-thai text-xs">{year}</Badge>
            <Badge variant="outline" className="font-thai text-xs">{total} คน</Badge>
            <Badge variant="outline" className="font-thai text-xs">{groupCount} กลุ่ม</Badge>
            <Badge
              className={`font-thai text-xs border-0 ${
                filled === total && total > 0 ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
              }`}
            >
              {filledLabel} ({filled}/{total})
            </Badge>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <CardContent className="pt-0 p-0 border-t space-y-0">
          <div className="flex flex-wrap gap-3 items-center p-3 border-b bg-gray-50/50">
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
                <SelectItem value="filled" className="font-thai">กรอกครบแล้ว</SelectItem>
                <SelectItem value="unfilled" className="font-thai">ยังกรอกไม่ครบ</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                      <TableHead className="font-thai whitespace-nowrap">รหัสนักศึกษา</TableHead>
                      <TableHead className="font-thai whitespace-nowrap">ชื่อ-นามสกุล</TableHead>
                      {data.activities.map((a) => (
                        <TableHead key={a.id} className="font-thai whitespace-nowrap">
                          {a.name}
                          <span className="text-gray-400 font-normal"> (≥{a.passThreshold}%)</span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm whitespace-nowrap">{student.studentId}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <p className="font-thai font-medium">
                            {student.prefix}{student.firstName} {student.lastName}
                          </p>
                          {student.group && <p className="text-xs text-gray-400 font-thai">กลุ่ม {student.group}</p>}
                        </TableCell>
                        {data.activities.map((a) => {
                          const cell = student.scores[a.id]
                          return (
                            <TableCell key={a.id}>
                              <div className="flex flex-col gap-0.5">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={values[student.id]?.[a.id] ?? ""}
                                  onChange={(e) => setValue(student.id, a.id, e.target.value)}
                                  className="w-20 font-mono"
                                />
                                {cell?.score != null && cell.isDraft && (
                                  <span className="text-[10px] text-amber-600 font-thai">ฉบับร่าง</span>
                                )}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t">
                <div className="flex gap-2">
                  <Button onClick={handleSaveFinal} disabled={saving} className="font-thai gap-1.5">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    บันทึก
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    variant="outline"
                    className="font-thai gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    บันทึกฉบับร่าง
                  </Button>
                </div>

                {data.totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-500 font-thai whitespace-nowrap">
                      หน้า {data.page}/{data.totalPages}
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
              </div>
            </>
          )}
        </CardContent>
      )}

      <Dialog open={confirmEntries !== null} onOpenChange={(o) => !o && setConfirmEntries(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-thai">ยืนยันข้อมูลถูกต้อง?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 font-thai">
            การบันทึกครั้งนี้จะทำให้นักศึกษาชั้น {year} กรอกคะแนนครบทุกคนแล้ว กรุณาตรวจสอบว่าข้อมูลที่กรอกถูกต้องก่อนยืนยัน
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmEntries(null)}
              disabled={saving}
              className="font-thai"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                const entries = confirmEntries
                setConfirmEntries(null)
                if (entries) submitEntries(entries, false)
              }}
              disabled={saving}
              className="font-thai gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              ตกลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
