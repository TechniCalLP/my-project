"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import LogoFormDialog from "@/components/admin/logo-form-dialog"

export default function LogoRowActions({ logo }: { logo: string | null }) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirm("ต้องการลบโลโก้ที่ตั้งไว้หรือไม่? ระบบจะกลับไปใช้โลโก้เริ่มต้น")) return
    setRemoving(true)
    try {
      const res = await fetch("/api/admin/settings/logo", { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("ลบโลโก้แล้ว")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <LogoFormDialog
        currentLogo={logo}
        trigger={
          <Button variant="outline" size="sm" className="font-thai gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            แก้ไขข้อมูล
          </Button>
        }
      />
      {logo && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleRemove}
          disabled={removing}
          aria-label="ลบ"
          className="text-secondary-600 hover:bg-secondary-50 hover:text-secondary-700"
        >
          {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      )}
    </div>
  )
}
