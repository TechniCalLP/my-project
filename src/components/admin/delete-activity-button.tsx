"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteActivityButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`ต้องการลบกิจกรรม "${name}" ใช่หรือไม่?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("ไม่สามารถลบกิจกรรมได้")
        return
      }
      toast.success("ลบกิจกรรมสำเร็จ")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={deleting}
      className="gap-1 text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700 font-thai"
      onClick={handleDelete}
    >
      <Trash2 className="w-3.5 h-3.5" />
      {deleting ? "..." : "ลบ"}
    </Button>
  )
}
