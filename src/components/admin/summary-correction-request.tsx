"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, FileEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { StudentRow } from "@/components/admin/summary-year-detail"

interface SummaryCorrectionRequestProps {
  selectedRows: StudentRow[]
  onSubmitted?: () => void
}

interface CorrectableOption {
  studentId: string
  activityId: string
  studentName: string
  activityName: string
  currentScore: number
}

export default function SummaryCorrectionRequest({ selectedRows, onSubmitted }: SummaryCorrectionRequestProps) {
  const [open, setOpen] = useState(false)
  const [correctionStudentId, setCorrectionStudentId] = useState("")
  const [correctionActivityId, setCorrectionActivityId] = useState("")
  const [correctionScore, setCorrectionScore] = useState("")
  const [correctionReason, setCorrectionReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const correctableOptions: CorrectableOption[] = selectedRows.flatMap((row) =>
    row.vocationalActivities
      .filter((a) => a.score != null)
      .map((a) => ({
        studentId: row.id,
        activityId: a.id,
        studentName: `${row.prefix}${row.firstName} ${row.lastName}`,
        activityName: a.name,
        currentScore: a.score!,
      }))
  )
  const correctableStudents = [...new Map(correctableOptions.map((o) => [o.studentId, o])).values()]
  const activitiesForStudent = correctableOptions.filter((o) => o.studentId === correctionStudentId)
  const correctionTarget = activitiesForStudent.find((o) => o.activityId === correctionActivityId) ?? null

  const openDialog = () => {
    setOpen(true)
    const first = correctableOptions[0]
    setCorrectionStudentId(first?.studentId ?? "")
    setCorrectionActivityId(first?.activityId ?? "")
    setCorrectionScore("")
    setCorrectionReason("")
  }

  const selectStudent = (studentId: string) => {
    setCorrectionStudentId(studentId)
    const firstActivity = correctableOptions.find((o) => o.studentId === studentId)
    setCorrectionActivityId(firstActivity?.activityId ?? "")
    setCorrectionScore("")
  }

  const selectActivity = (activityId: string) => {
    setCorrectionActivityId(activityId)
    setCorrectionScore("")
  }

  const closeDialog = () => {
    setOpen(false)
    setCorrectionStudentId("")
    setCorrectionActivityId("")
  }

  const submit = async () => {
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
    setSubmitting(true)
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
      closeDialog()
      onSubmitted?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={selectedRows.length === 0}
        onClick={openDialog}
        className="font-thai gap-1.5 shrink-0"
      >
        <FileEdit className="w-3.5 h-3.5" />
        ขอแก้ไขคะแนน{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
      </Button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-thai">ขอแก้ไขคะแนน</DialogTitle>
          </DialogHeader>

          {correctableOptions.length === 0 ? (
            <p className="text-sm text-gray-500 font-thai">
              นักศึกษาที่เลือกยังไม่มีคะแนนกิจกรรมองค์การวิชาชีพที่บันทึกแล้ว
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-thai">นักศึกษา *</Label>
                  <Select value={correctionStudentId} onValueChange={selectStudent}>
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
                  <Select value={correctionActivityId} onValueChange={selectActivity}>
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
                      <Input type="number" value={correctionTarget.currentScore} disabled className="font-mono bg-gray-50" />
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={submitting} className="font-thai">
              ยกเลิก
            </Button>
            <Button onClick={submit} disabled={submitting || !correctionTarget} className="font-thai gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ส่งคำขอ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
