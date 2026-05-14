"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { YEARS, DEPARTMENTS, PREFIXES } from "@/lib/constants"

interface StudentFormProps {
  initialData?: {
    id: string
    studentId: string
    prefix: string
    firstName: string
    lastName: string
    year: string
    department: string
    email: string | null
    phone: string | null
    isActive: boolean
  }
  isEdit?: boolean
}

export default function StudentForm({ initialData, isEdit = false }: StudentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [prefix, setPrefix] = useState(initialData?.prefix || "")
  const [department, setDepartment] = useState(initialData?.department || "")
  const [year, setYear] = useState(initialData?.year || "")
  const [isActive, setIsActive] = useState(String(initialData?.isActive ?? true))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      studentId: formData.get("studentId") as string,
      prefix,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      department,
      year,
      isActive: isActive === "true",
    }

    try {
      const url = isEdit ? `/api/admin/students/${initialData!.id}` : "/api/admin/students"
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

      toast.success(isEdit ? "แก้ไขข้อมูลนักศึกษาเรียบร้อยแล้ว" : "เพิ่มนักศึกษาเรียบร้อยแล้ว (รหัสผ่านเริ่มต้นคือรหัสนักศึกษา)")
      router.push("/admin/students")
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
        <Label className="font-thai">รหัสนักศึกษา *</Label>
        <Input
          name="studentId"
          defaultValue={initialData?.studentId}
          disabled={isEdit}
          required
          className="font-mono"
          placeholder="เช่น 66011234"
        />
        {!isEdit && (
          <p className="text-xs text-gray-500 font-thai">รหัสผ่านเริ่มต้นจะเป็นรหัสนักศึกษา</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="font-thai">คำนำหน้า *</Label>
          <Select value={prefix} onValueChange={setPrefix} required>
            <SelectTrigger className="font-thai">
              <SelectValue placeholder="เลือก" />
            </SelectTrigger>
            <SelectContent>
              {PREFIXES.map((p) => (
                <SelectItem key={p} value={p} className="font-thai">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-thai">ชื่อ *</Label>
          <Input name="firstName" defaultValue={initialData?.firstName} required className="font-thai" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-thai">นามสกุล *</Label>
          <Input name="lastName" defaultValue={initialData?.lastName} required className="font-thai" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-thai">อีเมล</Label>
          <Input name="email" type="email" defaultValue={initialData?.email || ""} placeholder="อีเมล (ไม่บังคับ)" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-thai">เบอร์โทร</Label>
          <Input name="phone" defaultValue={initialData?.phone || ""} placeholder="เบอร์โทร (ไม่บังคับ)" className="font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-thai">แผนก *</Label>
          <Select value={department} onValueChange={setDepartment} required>
            <SelectTrigger className="font-thai">
              <SelectValue placeholder="เลือกแผนก" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d} className="font-thai">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-thai">ระดับชั้น *</Label>
          <Select value={year} onValueChange={setYear} required>
            <SelectTrigger className="font-thai">
              <SelectValue placeholder="เลือกระดับชั้น" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label className="font-thai">สถานะการใช้งาน *</Label>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger className="font-thai">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true" className="font-thai">ใช้งาน</SelectItem>
              <SelectItem value="false" className="font-thai">ปิดการใช้งาน</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="font-thai gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มนักศึกษา"}
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
