"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search, UserPlus, AlertTriangle, Check } from "lucide-react"

interface StudentSearchResult {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  year: string
  department: string
}

interface AddParticipantDialogProps {
  activityId: string
  activityTargetYear: string
  activityTargetDepartments: string[]
  existingStudentIds: string[]
  onAdded: () => void
}

export default function AddParticipantDialog({
  activityId,
  activityTargetYear,
  activityTargetDepartments,
  existingStudentIds,
  onAdded,
}: AddParticipantDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [results, setResults] = useState<StudentSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<StudentSearchResult | null>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setSearchInput("")
    setResults([])
    setSelected(null)
    setNote("")
  }

  useEffect(() => {
    if (searchInput.trim().length < 2) return
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/admin/students?search=${encodeURIComponent(searchInput.trim())}`)
        if (!res.ok) return
        setResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const visibleResults = searchInput.trim().length >= 2 ? results : []

  const alreadyJoined = selected ? existingStudentIds.includes(selected.id) : false
  const eligibilityMismatch =
    selected && (selected.year !== activityTargetYear ||
      (activityTargetDepartments.length > 0 && !activityTargetDepartments.includes(selected.department)))

  const handleSubmit = async () => {
    if (!selected || !note.trim() || alreadyJoined) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/activities/${activityId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selected.id, note: note.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      toast.success(`เพิ่ม ${selected.prefix}${selected.firstName} ${selected.lastName} เข้าร่วมกิจกรรมแล้ว`)
      setOpen(false)
      reset()
      onAdded()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <Button size="sm" className="font-thai gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="w-3.5 h-3.5" />
        เพิ่มผู้เข้าร่วม
      </Button>
      <DialogContent className="font-thai sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-thai">เพิ่มผู้เข้าร่วมด้วยตนเอง</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          {!selected ? (
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  autoFocus
                  placeholder="ค้นหา รหัสนักศึกษา, ชื่อ, นามสกุล"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8 font-thai"
                />
              </div>
              {searching && (
                <p className="text-xs text-gray-400 font-thai flex items-center gap-1.5 pt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> กำลังค้นหา...
                </p>
              )}
              {!searching && searchInput.trim().length >= 2 && visibleResults.length === 0 && (
                <p className="text-xs text-gray-400 font-thai pt-1">ไม่พบนักศึกษาที่ตรงกับคำค้นหา</p>
              )}
              {visibleResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {visibleResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelected(s)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm font-thai"
                    >
                      <p className="font-medium">{s.prefix}{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">
                        {s.studentId} · {s.department} · {s.year}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-thai font-medium text-sm flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-success" />
                    {selected.prefix}{selected.firstName} {selected.lastName}
                  </p>
                  <p className="text-xs text-gray-500 font-thai mt-0.5">
                    {selected.studentId} · {selected.department} · {selected.year}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="font-thai" onClick={() => setSelected(null)}>
                  เปลี่ยน
                </Button>
              </div>

              {alreadyJoined && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive font-thai">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  นักศึกษาคนนี้เข้าร่วมกิจกรรมนี้อยู่แล้ว
                </div>
              )}

              {!alreadyJoined && eligibilityMismatch && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700 font-thai">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  นักศึกษาคนนี้อยู่ {selected.year} / {selected.department} แต่กิจกรรมนี้กำหนดไว้สำหรับ {activityTargetYear}
                  {activityTargetDepartments.length > 0 && ` (${activityTargetDepartments.join(", ")})`} — ตรวจสอบให้แน่ใจก่อนเพิ่ม
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-thai font-medium">เหตุผลที่เพิ่มด้วยตนเอง *</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น รหัสกิจกรรมหาย, แก้ไขข้อมูลที่เข้าร่วมผิดชั้นปี"
                  className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm font-thai"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" className="font-thai" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            disabled={!selected || !note.trim() || alreadyJoined || submitting}
            onClick={handleSubmit}
            className="font-thai gap-1.5"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            เพิ่มเข้าร่วม
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
