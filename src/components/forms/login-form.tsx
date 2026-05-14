"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: standardSchemaResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const result = await signIn("student-login", {
        studentId: data.studentId,
        password: data.password,
        redirect: false,
      })

      if (!result?.ok || result.error) {
        toast.error("รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง")
        return
      }

      const session = await getSession()
      if (session?.user?.isFirstLogin) {
        router.push("/settings")
      } else {
        router.push("/dashboard")
      }
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
        <Label htmlFor="studentId" className="font-thai">รหัสนักศึกษา</Label>
        <Input
          id="studentId"
          placeholder="กรอกรหัสนักศึกษา 11 หลัก"
          inputMode="numeric"
          {...register("studentId")}
          disabled={loading}
        />
        {errors.studentId && (
          <p className="text-sm text-red-500 font-thai">{errors.studentId.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="font-thai">รหัสผ่าน</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="กรอกรหัสผ่าน"
            className="pr-10"
            {...register("password")}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
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
