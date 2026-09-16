"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Trash2, Pencil, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import SignatureFormDialog from "@/components/admin/signature-form-dialog"

interface SignatureRowActionsProps {
  signature: { id: string; name: string; position: string; imageData: string; isActive: boolean }
}

export default function SignatureRowActions({ signature }: SignatureRowActionsProps) {
  const router = useRouter()
  const [activating, setActivating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleActivate = async () => {
    setActivating(true)
    try {
      const res = await fetch(`/api/admin/settings/signatures/${signature.id}/activate`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("เปิดใช้งานลายเซ็นนี้แล้ว")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setActivating(false)
    }
  }

  const handleDelete = async () => {
    const warning = signature.isActive
      ? `"${signature.name}" กำลังใช้งานอยู่ในเอกสารขณะนี้ หากลบแล้วเอกสารจะไม่มีลายเซ็นจนกว่าจะเปิดใช้งานรายการอื่น ต้องการลบใช่หรือไม่?`
      : `ต้องการลบลายเซ็น "${signature.name}" ใช่หรือไม่?`
    if (!confirm(warning)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/settings/signatures/${signature.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("ลบลายเซ็นแล้ว")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {!signature.isActive && (
        <Button variant="outline" size="sm" onClick={handleActivate} disabled={activating} className="font-thai gap-1.5">
          {activating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          เปิดใช้งาน
        </Button>
      )}
      <SignatureFormDialog
        mode="edit"
        signature={signature}
        trigger={
          <Button variant="outline" size="sm" className="font-thai gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            แก้ไขข้อมูล
          </Button>
        }
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="ลบ"
        className="text-secondary-600 hover:bg-secondary-50 hover:text-secondary-700"
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </Button>
    </div>
  )
}
