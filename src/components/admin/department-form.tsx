"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, X, Plus } from "lucide-react"

interface DepartmentFormProps {
  initialData?: { id: string; name: string; aliases: string[] }
  isEdit?: boolean
}

export default function DepartmentForm({ initialData, isEdit = false }: DepartmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aliases, setAliases] = useState<string[]>(initialData?.aliases ?? [])
  const [aliasInput, setAliasInput] = useState("")

  const addAlias = () => {
    const trimmed = aliasInput.trim()
    if (!trimmed) return
    if (aliases.includes(trimmed)) {
      toast.error("มีชื่อนี้อยู่แล้ว")
      return
    }
    setAliases((prev) => [...prev, trimmed])
    setAliasInput("")
  }

  const removeAlias = (alias: string) => {
    setAliases((prev) => prev.filter((a) => a !== alias))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = { name: formData.get("name") as string, aliases }

    try {
      const url = isEdit ? `/api/admin/departments/${initialData!.id}` : "/api/admin/departments"
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

      toast.success(isEdit ? "แก้ไขแผนกเรียบร้อยแล้ว" : "เพิ่มแผนกเรียบร้อยแล้ว")
      router.push("/admin/departments")
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
        <Label className="font-thai">ชื่อแผนก *</Label>
        <Input name="name" defaultValue={initialData?.name} required className="font-thai" placeholder="เช่น เทคนิคคอมพิวเตอร์" />
        {isEdit && (
          <p className="text-xs text-gray-500 font-thai">
            หมายเหตุ: การเปลี่ยนชื่อแผนกจะไม่กระทบข้อมูลนักศึกษา/กิจกรรมที่บันทึกไว้แล้วด้วยชื่อเดิม
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">ชื่อเรียกอื่น / ชื่อเดิม</Label>
        <p className="text-xs text-gray-500 font-thai">
          ใช้กรณีแผนกนี้เคยใช้ชื่ออื่นในรุ่นก่อนหน้า (เช่น ชื่อในข้อมูลนักเรียนที่นำเข้ามา) นักศึกษาที่มีชื่อแผนกตรงกับรายการนี้จะถูกนับรวมเป็นแผนกเดียวกัน
        </p>
        <div className="flex gap-2">
          <Input
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addAlias()
              }
            }}
            className="font-thai"
            placeholder="เช่น ไฟฟ้า, ไฟฟ้ากำลัง"
          />
          <Button type="button" variant="outline" onClick={addAlias} className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />
            เพิ่ม
          </Button>
        </div>
        {aliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {aliases.map((alias) => (
              <Badge key={alias} variant="outline" className="font-thai gap-1 pr-1">
                {alias}
                <button
                  type="button"
                  onClick={() => removeAlias(alias)}
                  className="rounded-full hover:bg-gray-200 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="font-thai gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มแผนก"}
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
