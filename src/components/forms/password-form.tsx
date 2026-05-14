"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { passwordSchema, type PasswordInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PasswordForm() {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordInput>({
    resolver: standardSchemaResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่")
      reset()
      setTimeout(() => {
        signOut({ callbackUrl: "/login" })
      }, 1500)
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="font-thai">รหัสผ่านปัจจุบัน</Label>
        <Input
          id="currentPassword"
          type="password"
          {...register("currentPassword")}
          disabled={loading}
        />
        {errors.currentPassword && (
          <p className="text-sm text-red-500 font-thai">{errors.currentPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="font-thai">รหัสผ่านใหม่</Label>
        <Input
          id="newPassword"
          type="password"
          {...register("newPassword")}
          disabled={loading}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-500 font-thai">{errors.newPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="font-thai">ยืนยันรหัสผ่านใหม่</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          disabled={loading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 font-thai">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full font-thai" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
      </Button>
    </form>
  )
}
