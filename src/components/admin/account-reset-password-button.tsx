"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Key, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AccountResetPasswordButtonProps {
  accountId: string
  accountName: string
}

export default function AccountResetPasswordButton({ accountId, accountName }: AccountResetPasswordButtonProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (password.length < 4) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts/${accountId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(`รีเซ็ตรหัสผ่านของ ${accountName} สำเร็จ`)
      setOpen(false)
      setPassword("")
    } catch {
      toast.error("ไม่สามารถรีเซ็ตรหัสผ่านได้")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-thai gap-2">
          <Key className="w-4 h-4" />
          รีเซ็ตรหัสผ่าน
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-thai">รีเซ็ตรหัสผ่าน — {accountName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="font-thai">รหัสผ่านใหม่</Label>
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 4 ตัวอักษร"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleReset} disabled={loading} className="font-thai gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
