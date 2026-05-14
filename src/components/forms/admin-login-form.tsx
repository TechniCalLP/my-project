"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { adminLoginSchema, type AdminLoginInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AdminLoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInput>({
    resolver: standardSchemaResolver(adminLoginSchema),
  })

  const onSubmit = async (data: AdminLoginInput) => {
    setLoading(true)
    try {
      const result = await signIn("admin-login", {
        username: data.username,
        password: data.password,
        redirect: false,
      })

      if (!result?.ok || result.error) {
        toast.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
        return
      }

      router.push("/admin/dashboard")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="font-thai">ชื่อผู้ใช้</Label>
        <Input
          id="username"
          placeholder="กรอกชื่อผู้ใช้"
          {...register("username")}
          disabled={loading}
        />
        {errors.username && (
          <p className="text-sm text-red-500 font-thai">{errors.username.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="font-thai">รหัสผ่าน</Label>
        <Input
          id="password"
          type="password"
          placeholder="กรอกรหัสผ่าน"
          {...register("password")}
          disabled={loading}
        />
        {errors.password && (
          <p className="text-sm text-red-500 font-thai">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full font-thai" disabled={loading}>
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>
    </form>
  )
}
