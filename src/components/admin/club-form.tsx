"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Loader2, ChevronDown } from "lucide-react"

interface Department {
  id: string
  name: string
  clubs?: { id: string; name: string }[]
}

interface ClubFormProps {
  departments: Department[]
  initialData?: {
    id: string
    name: string
    departments: Department[]
  }
  isEdit?: boolean
}

export default function ClubForm({ departments, initialData, isEdit = false }: ClubFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    initialData?.departments.map((d) => d.id) ?? []
  )

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedDeptIds.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 แผนก")
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      departmentIds: selectedDeptIds,
    }

    try {
      const url = isEdit ? `/api/admin/clubs/${initialData!.id}` : "/api/admin/clubs"
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

      toast.success(isEdit ? "แก้ไขชมรมเรียบร้อยแล้ว" : "เพิ่มชมรมเรียบร้อยแล้ว")
      router.push("/admin/clubs")
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
        <Label className="font-thai">ชื่อชมรมวิชาชีพ *</Label>
        <Input
          name="name"
          defaultValue={initialData?.name}
          required
          className="font-thai"
          placeholder="เช่น ชมรมวิชาชีพช่างกล"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">แผนกที่อยู่ในชมรมนี้ *</Label>
        <p className="text-xs text-gray-500 font-thai">
          เลือกได้หลายแผนก — แผนกที่ชื่อไม่ตรงกันในแต่ละปีสามารถรวมอยู่ในชมรมเดียวกันได้ (เช่น เทคนิคการผลิต + ช่างกลโรงงาน)
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between font-thai font-normal">
              <span className={selectedDeptIds.length === 0 ? "text-muted-foreground" : ""}>
                {selectedDeptIds.length === 0
                  ? "เลือกแผนก"
                  : `เลือกแล้ว ${selectedDeptIds.length} แผนก`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-(--radix-dropdown-menu-trigger-width) max-h-80 overflow-y-auto">
            {departments.map((dept) => {
              const isSelected = selectedDeptIds.includes(dept.id)
              const boundToOtherClub = dept.clubs?.find((c) => c.id !== initialData?.id)
              return (
                <DropdownMenuCheckboxItem
                  key={dept.id}
                  checked={isSelected}
                  onCheckedChange={() => toggleDept(dept.id)}
                  onSelect={(e) => e.preventDefault()}
                  disabled={!isSelected && !!boundToOtherClub}
                  className="font-thai"
                >
                  <div className="flex flex-col">
                    <span>{dept.name}</span>
                    {boundToOtherClub && (
                      <span className="text-xs text-amber-600 font-normal">
                        อยู่ในชมรม &ldquo;{boundToOtherClub.name}&rdquo; แล้ว
                      </span>
                    )}
                  </div>
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="font-thai gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มชมรม"}
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
