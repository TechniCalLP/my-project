"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ADMIN_ROLE_NAMES } from "@/lib/constants"

interface Department {
  id: string
  name: string
}

interface AccountFormProps {
  departments: Department[]
  initialData?: {
    id: string
    username: string
    name: string
    role: "SUPER_ADMIN" | "ADMIN" | "TEACHER"
    departmentId: string | null
  }
  isEdit?: boolean
}

export default function AccountForm({ departments, initialData, isEdit = false }: AccountFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<string>(initialData?.role || "ADMIN")
  const [departmentId, setDepartmentId] = useState(initialData?.departmentId || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string

    const data = {
      ...(isEdit ? {} : { username: formData.get("username") as string }),
      ...(password ? { password } : {}),
      name: formData.get("name") as string,
      role,
      departmentId: role === "TEACHER" ? departmentId : null,
    }

    try {
      const url = isEdit ? `/api/admin/accounts/${initialData!.id}` : "/api/admin/accounts"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }

      toast.success(isEdit ? "แก้ไขบัญชีเรียบร้อยแล้ว" : "เพิ่มบัญชีเรียบร้อยแล้ว")
      router.push("/admin/accounts")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-thai">ชื่อผู้ใช้ *</Label>
        <Input
          name="username"
          defaultValue={initialData?.username}
          disabled={isEdit}
          required={!isEdit}
          className="font-mono"
          placeholder="เช่น teacher_it"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">{isEdit ? "รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน *"}</Label>
        <Input
          name="password"
          type="text"
          required={!isEdit}
          placeholder="อย่างน้อย 4 ตัวอักษร"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">ชื่อ-นามสกุล *</Label>
        <Input name="name" defaultValue={initialData?.name} required className="font-thai" />
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">บทบาท *</Label>
        <Select value={role} onValueChange={setRole} required>
          <SelectTrigger className="font-thai">
            <SelectValue placeholder="เลือกบทบาท" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ADMIN_ROLE_NAMES).map(([value, label]) => (
              <SelectItem key={value} value={value} className="font-thai">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {role === "TEACHER" && (
        <div className="space-y-1.5">
          <Label className="font-thai">แผนก *</Label>
          <Select value={departmentId} onValueChange={setDepartmentId} required>
            <SelectTrigger className="font-thai">
              <SelectValue placeholder="เลือกแผนก" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id} className="font-thai">{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="font-thai gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มบัญชี"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="font-thai"
        >
          ยกเลิก
        </Button>
      </div>
    </form>
  )
}
