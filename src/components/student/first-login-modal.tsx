"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Eye, EyeOff, Lock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[0-9]/.test(password)) score++
  if (/[a-zA-Z]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: "อ่อนมาก", color: "bg-red-500" }
  if (score === 2) return { score: 2, label: "อ่อน", color: "bg-orange-400" }
  if (score === 3) return { score: 3, label: "ปานกลาง", color: "bg-yellow-400" }
  if (score === 4) return { score: 4, label: "แข็งแรง", color: "bg-green-400" }
  return { score: 5, label: "แข็งแรงมาก", color: "bg-green-600" }
}

export default function FirstLoginModal() {
  const { data: session, update } = useSession()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!session?.user?.isFirstLogin) return null

  const strength = getStrength(newPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน")
      return
    }
    if (newPassword.length < 8) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/password/first-login", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

      // อัปเดต session ให้ isFirstLogin = false โดยไม่ logout
      await update({ isFirstLogin: false })
      toast.success("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary-500" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center font-thai text-gray-900 mb-1">
          ตั้งรหัสผ่านใหม่
        </h2>
        <p className="text-sm text-gray-500 text-center font-thai mb-6">
          กรุณาตั้งรหัสผ่านใหม่สำหรับการเข้าสู่ระบบครั้งต่อไป
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <Label className="font-thai">รหัสผ่านใหม่</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="กรอกรหัสผ่านใหม่"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 font-thai"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-thai ${
                  strength.score <= 1 ? "text-red-500" :
                  strength.score === 2 ? "text-orange-400" :
                  strength.score === 3 ? "text-yellow-500" :
                  "text-green-600"
                }`}>
                  ความปลอดภัย: {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label className="font-thai">ยืนยันรหัสผ่าน</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 font-thai"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Hint */}
          <div className="flex items-start gap-2 text-xs text-gray-400 font-thai">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวเลขและตัวอักษร</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="font-thai"
              disabled={loading}
              onClick={() => {
                // ปิด modal ชั่วคราว แต่ยังอยู่ในระบบ — จะแสดงอีกครั้งเมื่อ login ใหม่
                update({ isFirstLogin: false })
              }}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              className="font-thai bg-primary-500 hover:bg-primary-600"
            >
              {loading ? "กำลังบันทึก..." : "ยืนยัน"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
