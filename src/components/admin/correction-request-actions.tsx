"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function CorrectionRequestActions({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reviewNote, setReviewNote] = useState("")

  const review = async (status: "APPROVED" | "REJECTED", note?: string) => {
    setLoading(status === "APPROVED" ? "approve" : "reject")
    try {
      const res = await fetch(`/api/admin/correction-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      toast.success(status === "APPROVED" ? "อนุมัติคำขอแก้ไขคะแนนแล้ว" : "ปฏิเสธคำขอแล้ว")
      setRejectOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          className="gap-1 font-thai bg-success hover:bg-success/90"
          disabled={loading !== null}
          onClick={() => review("APPROVED")}
        >
          {loading === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          อนุมัติ
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 font-thai text-secondary-600"
          disabled={loading !== null}
          onClick={() => setRejectOpen(true)}
        >
          <X className="w-3.5 h-3.5" />
          ปฏิเสธ
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-thai">ปฏิเสธคำขอแก้ไขคะแนน</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="font-thai">เหตุผล (ถ้ามี)</Label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-thai"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading !== null} className="font-thai">
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => review("REJECTED", reviewNote)}
              disabled={loading !== null}
              className="font-thai gap-2"
            >
              {loading === "reject" && <Loader2 className="w-4 h-4 animate-spin" />}
              ยืนยันปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
