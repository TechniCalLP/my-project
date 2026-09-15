"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, FileEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { StudentRow } from "@/components/admin/summary-year-detail"

interface SummaryCorrectionRequestProps {
  year: string
  academicYear: string
  selectedRows: StudentRow[]
  onSubmitted?: () => void
}

interface CorrectionCard {
  key: string
  studentId: string
  activityId: string
  studentLabel: string
  activityName: string
  currentScore: number
}

export default function SummaryCorrectionRequest({ year, academicYear, selectedRows, onSubmitted }: SummaryCorrectionRequestProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [newScores, setNewScores] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const cards: CorrectionCard[] = selectedRows.flatMap((row) =>
    row.vocationalActivities
      .filter((a) => a.score != null)
      .map((a) => ({
        key: `${row.id}::${a.id}`,
        studentId: row.id,
        activityId: a.id,
        studentLabel: `${row.studentId} ${row.prefix}${row.firstName} ${row.lastName} ${row.year} กลุ่ม ${row.group ?? "-"}`,
        activityName: a.name,
        currentScore: a.score!,
      }))
  )

  const openDialog = () => {
    setOpen(true)
    setReason("")
    setNewScores({})
  }

  const closeDialog = () => {
    setOpen(false)
    setReason("")
    setNewScores({})
  }

  const setNewScore = (key: string, value: string) => {
    setNewScores((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("กรุณาระบุเหตุผลรวม")
      return
    }

    const entries = cards
      .map((c) => ({ card: c, raw: newScores[c.key] }))
      .filter((e) => e.raw !== undefined && e.raw !== "")

    if (entries.length === 0) {
      toast.error("กรุณากรอกคะแนนใหม่อย่างน้อย 1 คน")
      return
    }

    for (const { card, raw } of entries) {
      const num = Number(raw)
      if (Number.isNaN(num) || num < 0 || num > 100) {
        toast.error(`คะแนนใหม่ของ ${card.studentLabel} ต้องอยู่ระหว่าง 0-100`)
        return
      }
    }

    setSubmitting(true)
    try {
      let failed = 0
      for (const { card, raw } of entries) {
        const res = await fetch("/api/teacher/vocational-activities/correction-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityId: card.activityId,
            studentId: card.studentId,
            proposedScore: Number(raw),
            reason: reason.trim(),
          }),
        })
        if (!res.ok) failed++
      }

      if (failed === 0) {
        toast.success(`ส่งคำขอแก้ไขคะแนนแล้ว ${entries.length} รายการ รอผู้ดูแลระบบอนุมัติ`)
      } else {
        toast.warning(`ส่งสำเร็จ ${entries.length - failed} รายการ, ล้มเหลว ${failed} รายการ`)
      }
      closeDialog()
      onSubmitted?.()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={selectedRows.length === 0}
        onClick={openDialog}
        className="font-thai gap-1.5 shrink-0"
      >
        <FileEdit className="w-3.5 h-3.5" />
        ขอแก้ไขคะแนน{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
      </Button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
        <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-thai">ส่งคำขออนุมัติแก้ไขคะแนนรายบุคคล</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 font-thai -mt-2 shrink-0">
            ผลรวมการประเมินกิจกรรมองค์การวิชาชีพ | ระดับ: {year} ปีการศึกษา {academicYear}
          </p>

          {cards.length === 0 ? (
            <p className="text-sm text-gray-500 font-thai">
              นักศึกษาที่เลือกยังไม่มีคะแนนกิจกรรมองค์การวิชาชีพที่บันทึกแล้ว
            </p>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-1.5">
                <Label className="font-thai">เหตุผลรวม *</Label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เช่น กรอกคะแนนสลับคอลัมน์ผิดพลาดระหว่างบันทึกผลกิจกรรม"
                  className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm font-thai"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium font-thai">
                  รายการนักศึกษาที่เลือกเพื่อส่งคำขอแก้ไข ({cards.length} คน)
                </p>
                <div className="space-y-2">
                  {cards.map((card) => (
                    <div key={card.key} className="rounded-md border p-3 space-y-2">
                      <p className="text-sm font-thai font-medium">
                        {card.studentLabel}
                        {cards.length > 1 && <span className="text-gray-400 font-normal"> · {card.activityName}</span>}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-thai text-xs text-gray-500">คะแนนเดิม</Label>
                          <Input type="number" value={card.currentScore} disabled className="font-mono bg-gray-50" />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-thai text-xs">คะแนนใหม่</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={newScores[card.key] ?? ""}
                            onChange={(e) => setNewScore(card.key, e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={closeDialog} disabled={submitting} className="font-thai">
              ยกเลิก
            </Button>
            <Button onClick={submit} disabled={submitting || cards.length === 0} className="font-thai gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ส่งคำขอแก้ไขคะแนน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
