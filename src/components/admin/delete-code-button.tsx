"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteCodeButtonProps {
  codeId: string
  code: string
}

export function DeleteCodeButton({ codeId, code }: DeleteCodeButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`ต้องการลบรหัส ${code} ใช่หรือไม่?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/codes/${codeId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "ไม่สามารถลบรหัสได้")
        return
      }
      toast.success(`ลบรหัส ${code} เรียบร้อยแล้ว`)
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 font-thai gap-1.5"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      ลบ
    </Button>
  )
}
