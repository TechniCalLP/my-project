"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
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
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Save, FileText, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

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
  activities: { id: string; name: string; passThreshold: number }[]
  rows: StudentRow[]
  total: number
  page: number
  totalPages: number
}

interface ActivityScoreEntryProps {
  activityId: string
  year: string
  academicYear: string
  semester: string
  groups: string[]
}

type StatusFilter = "all" | "filled" | "unfilled"
type Entry = { studentId: string; activityId: string; score: number }
const ALL_GROUPS = "__all__"
const PAGE_SIZE = 15 // must match PAGE_SIZE in /api/teacher/evaluation/route.ts

export default function ActivityScoreEntry({ activityId, year, academicYear, semester, groups }: ActivityScoreEntryProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [group, setGroup] = useState(ALL_GROUPS)
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
      const params = new URLSearchParams({ activityId, year, academicYear, semester, search, status, page: String(page) })
      if (group !== ALL_GROUPS) params.set("group", group)
      const res = await fetch(`/api/teacher/evaluation?${params.toString()}`)
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ")
      const json: EvalData = await res.json()
      setData(json)
      setValues(
        Object.fromEntries(
          json.rows.map((r) => [r.id, { [activityId]: r.scores[activityId]?.score?.toString() ?? "" }])
        )
      )
    } catch {
      toast.error("โหลดข้อมูลไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }, [activityId, year, academicYear, semester, search, status, group, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const setValue = (studentId: string, value: string) => {
    setValues((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [activityId]: value } }))
  }

  const collectEntries = (): Entry[] | null => {
    if (!data) return null
    const entries: Entry[] = []
    for (const row of data.rows) {
      const raw = values[row.id]?.[activityId]
      if (raw === undefined || raw === "") continue
      const num = Number(raw)
      if (Number.isNaN(num) || num < 0 || num > 100) {
        toast.error(`คะแนนของ ${row.prefix}${row.firstName} ${row.lastName} ต้องอยู่ระหว่าง 0-100`)
        return null
      }
      entries.push({ studentId: row.id, activityId, score: num })
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
    const entries = collectEntries()
    if (!entries) return
    setConfirmEntries(entries)
  }

  const isRowComplete = (row: StudentRow) => {
    const typed = values[row.id]?.[activityId]
    if (typed !== undefined && typed !== "") return true
    return row.scores[activityId]?.score != null
  }

  const allFilledOnPage = data ? data.rows.length > 0 && data.rows.every(isRowComplete) : false
  const activity = data?.activities[0]

  return (
    <Card>
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
        {groups.length > 0 && (
          <Select
            value={group}
            onValueChange={(v) => {
              setGroup(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-32 font-thai h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS} className="font-thai">ทุกกลุ่ม</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g} className="font-thai">กลุ่ม {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                  <TableHead className="font-thai whitespace-nowrap">
                    คะแนน{activity && <span className="text-gray-400 font-normal"> (≥{activity.passThreshold}%)</span>}
                  </TableHead>
                  <TableHead className="font-thai whitespace-nowrap">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((student) => {
                  const cell = student.scores[activityId]
                  return (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm whitespace-nowrap">{student.studentId}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="font-thai font-medium">
                          {student.prefix}{student.firstName} {student.lastName}
                        </p>
                        {student.group && <p className="text-xs text-gray-400 font-thai">กลุ่ม {student.group}</p>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={values[student.id]?.[activityId] ?? ""}
                            onChange={(e) => setValue(student.id, e.target.value)}
                            className="w-20 font-mono"
                          />
                          {cell?.score != null && cell.isDraft && (
                            <span className="text-[10px] text-amber-600 font-thai">ฉบับร่าง</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`font-thai text-xs border-0 whitespace-nowrap ${
                            isRowComplete(student) ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isRowComplete(student) ? "กรอกครบแล้ว" : "รอดำเนินการ"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="border-t">
            <div className="flex flex-wrap justify-end gap-2 px-4 py-3">
              <Button
                onClick={handleSaveFinal}
                disabled={saving || !allFilledOnPage}
                variant={allFilledOnPage ? "default" : "outline"}
                className="font-thai gap-1.5"
              >
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

            <PaginationControls
              currentPage={page}
              totalPages={data.totalPages}
              totalItems={data.total}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        </>
      )}

      <Dialog open={confirmEntries !== null} onOpenChange={(o) => !o && setConfirmEntries(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-thai">ยืนยันการบันทึกคะแนน</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 font-thai">
            กรอกคะแนนครบทุกคนในหน้านี้แล้ว ({confirmEntries?.length ?? 0} รายการ) กรุณาตรวจสอบว่าข้อมูลที่กรอกถูกต้องก่อนยืนยันบันทึกลงระบบ
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
