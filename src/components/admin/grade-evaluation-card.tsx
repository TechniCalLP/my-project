"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronUp, Save, FileText, Loader2, Search, ChevronLeft, ChevronRight, Lock } from "lucide-react"
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
  groups: string[]
  activityNames: string[]
}

type StatusFilter = "all" | "filled" | "unfilled"
type Entry = { studentId: string; activityId: string; score: number }
const ALL_GROUPS = "__all__"

interface CorrectionTarget {
  studentId: string
  activityId: string
  studentName: string
  activityName: string
  currentScore: number
}

export default function GradeEvaluationCard({
  year,
  academicYear,
  semester,
  total,
  filled,
  groupCount,
  groups,
  activityNames,
}: GradeEvaluationCardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false)
  const [correctionStudentId, setCorrectionStudentId] = useState("")
  const [correctionActivityId, setCorrectionActivityId] = useState("")
  const [correctionScore, setCorrectionScore] = useState("")
  const [correctionReason, setCorrectionReason] = useState("")
  const [submittingCorrection, setSubmittingCorrection] = useState(false)

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
      if (group !== ALL_GROUPS) params.set("group", group)
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
  }, [year, academicYear, semester, search, status, group, page])

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

  const correctableOptions: CorrectionTarget[] = data
    ? data.rows.flatMap((row) =>
        data.activities
          .filter((a) => {
            const cell = row.scores[a.id]
            return cell?.score != null && !cell.isDraft
          })
          .map((a) => ({
            studentId: row.id,
            activityId: a.id,
            studentName: `${row.prefix}${row.firstName} ${row.lastName}`,
            activityName: a.name,
            currentScore: row.scores[a.id].score!,
          }))
      )
    : []

  const correctableStudents = [...new Map(correctableOptions.map((o) => [o.studentId, o])).values()]
  const activitiesForStudent = correctableOptions.filter((o) => o.studentId === correctionStudentId)
  const correctionTarget = activitiesForStudent.find((o) => o.activityId === correctionActivityId) ?? null

  const openCorrectionDialog = () => {
    setCorrectionDialogOpen(true)
    const first = correctableOptions[0]
    setCorrectionStudentId(first?.studentId ?? "")
    setCorrectionActivityId(first?.activityId ?? "")
    setCorrectionScore("")
    setCorrectionReason("")
  }

  const selectCorrectionStudent = (studentId: string) => {
    setCorrectionStudentId(studentId)
    const firstActivity = correctableOptions.find((o) => o.studentId === studentId)
    setCorrectionActivityId(firstActivity?.activityId ?? "")
    setCorrectionScore("")
  }

  const selectCorrectionActivity = (activityId: string) => {
    setCorrectionActivityId(activityId)
    setCorrectionScore("")
  }

  const submitCorrectionRequest = async () => {
    if (!correctionTarget) return
    const num = Number(correctionScore)
    if (Number.isNaN(num) || num < 0 || num > 100) {
      toast.error("คะแนนที่ขอแก้ไขต้องอยู่ระหว่าง 0-100")
      return
    }
    if (!correctionReason.trim()) {
      toast.error("กรุณาระบุเหตุผลที่ขอแก้ไข")
      return
    }
    setSubmittingCorrection(true)
    try {
      const res = await fetch("/api/teacher/vocational-activities/correction-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: correctionTarget.activityId,
          studentId: correctionTarget.studentId,
          proposedScore: num,
          reason: correctionReason.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      toast.success("ส่งคำขอแก้ไขคะแนนแล้ว รอผู้ดูแลระบบอนุมัติ")
      setCorrectionDialogOpen(false)
      setCorrectionStudentId("")
      setCorrectionActivityId("")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSubmittingCorrection(false)
    }
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
                          const isFinalized = cell?.score != null && !cell.isDraft
                          return (
                            <TableCell key={a.id}>
                              <div className="flex flex-col gap-0.5">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={isFinalized ? cell!.score! : (values[student.id]?.[a.id] ?? "")}
                                  onChange={(e) => setValue(student.id, a.id, e.target.value)}
                                  disabled={isFinalized}
                                  className="w-20 font-mono"
                                />
                                {cell?.score != null && cell.isDraft && (
                                  <span className="text-[10px] text-amber-600 font-thai">ฉบับร่าง</span>
                                )}
                                {isFinalized && (
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400 font-thai">
                                    <Lock className="w-2.5 h-2.5" />
                                    บันทึกแล้ว
                                  </span>
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
                  {correctableOptions.length > 0 && (
                    <Button
                      onClick={openCorrectionDialog}
                      variant="outline"
                      className="font-thai gap-1.5 text-gray-600"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      ขอแก้ไขคะแนน
                    </Button>
                  )}
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

      <Dialog
        open={correctionDialogOpen}
        onOpenChange={(o) => {
          setCorrectionDialogOpen(o)
          if (!o) {
            setCorrectionStudentId("")
            setCorrectionActivityId("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-thai">ขอแก้ไขคะแนน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-thai">นักศึกษา *</Label>
                <Select value={correctionStudentId} onValueChange={selectCorrectionStudent}>
                  <SelectTrigger className="w-full font-thai">
                    <SelectValue placeholder="เลือกนักศึกษา" />
                  </SelectTrigger>
                  <SelectContent>
                    {correctableStudents.map((o) => (
                      <SelectItem key={o.studentId} value={o.studentId} className="font-thai">
                        {o.studentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-thai">กิจกรรม *</Label>
                <Select value={correctionActivityId} onValueChange={selectCorrectionActivity}>
                  <SelectTrigger className="w-full font-thai">
                    <SelectValue placeholder="เลือกกิจกรรม" />
                  </SelectTrigger>
                  <SelectContent>
                    {activitiesForStudent.map((o) => (
                      <SelectItem key={o.activityId} value={o.activityId} className="font-thai">
                        {o.activityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {correctionTarget && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-thai text-gray-500">คะแนนเดิม</Label>
                    <Input
                      type="number"
                      value={correctionTarget.currentScore}
                      disabled
                      className="font-mono bg-gray-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-thai">คะแนนใหม่ *</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={correctionScore}
                      onChange={(e) => setCorrectionScore(e.target.value)}
                      placeholder="กรอกคะแนนใหม่"
                      autoFocus
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-thai">เหตุผลที่ขอแก้ไข *</Label>
                  <textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="เช่น กรอกคะแนนผิดพลาด"
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-thai"
                  />
                </div>
                <p className="text-xs text-gray-400 font-thai">คำขอนี้จะถูกส่งให้ผู้ดูแลระบบอนุมัติก่อนคะแนนจะถูกแก้ไขจริง</p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCorrectionDialogOpen(false)
                setCorrectionStudentId("")
                setCorrectionActivityId("")
              }}
              disabled={submittingCorrection}
              className="font-thai"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={submitCorrectionRequest}
              disabled={submittingCorrection || !correctionTarget}
              className="font-thai gap-2"
            >
              {submittingCorrection && <Loader2 className="w-4 h-4 animate-spin" />}
              ส่งคำขอ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
