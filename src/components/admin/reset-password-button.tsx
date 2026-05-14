"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Key, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResetPasswordButtonProps {
  studentId: string
  studentName: string
}

export default function ResetPasswordButton({ studentId, studentName }: ResetPasswordButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!confirm(`ต้องการรีเซ็ตรหัสผ่านของ ${studentName} ใช่หรือไม่?\n\nรหัสผ่านใหม่จะเป็นรหัสนักศึกษา`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reset-password`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ — รหัสผ่านใหม่คือรหัสนักศึกษา")
    } catch {
      toast.error("ไม่สามารถรีเซ็ตรหัสผ่านได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={handleReset}
      className="font-thai gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
      รีเซ็ตรหัสผ่าน
    </Button>
  )
}
