"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserCheck, UserX, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ToggleStudentStatusButtonProps {
  studentId: string
  currentStatus: boolean
  studentName: string
}

export default function ToggleStudentStatusButton({
  studentId,
  currentStatus,
  studentName,
}: ToggleStudentStatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const action = currentStatus ? "ปิดการใช้งาน" : "เปิดใช้งาน"
    if (!confirm(`ต้องการ${action}บัญชี ${studentName} ใช่หรือไม่?`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!res.ok) throw new Error("Failed")

      toast.success(`${action}บัญชีเรียบร้อยแล้ว`)
      router.refresh()
    } catch {
      toast.error("ไม่สามารถเปลี่ยนสถานะได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleToggle}
      className={`font-thai gap-1 ${currentStatus ? "text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700" : "text-success hover:bg-success/10 hover:text-success"}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : currentStatus ? (
        <UserX className="w-3.5 h-3.5" />
      ) : (
        <UserCheck className="w-3.5 h-3.5" />
      )}
      {currentStatus ? "ปิดใช้งาน" : "เปิดใช้งาน"}
    </Button>
  )
}
