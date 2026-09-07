"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Loader2, ChevronDown } from "lucide-react"
import { ACADEMIC_YEARS, SEMESTERS, YEARS, DEFAULT_VOCATIONAL_PASS_THRESHOLD } from "@/lib/constants"

interface Department {
  id: string
  name: string
}

interface VocationalActivityFormProps {
  departments: Department[]
  initialData?: {
    id: string
    name: string
    academicYear: string
    semester: string
    targetYears: string[]
    passThreshold: number
    departments: Department[]
  }
  isEdit?: boolean
}

export default function VocationalActivityForm({ departments, initialData, isEdit = false }: VocationalActivityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [academicYear, setAcademicYear] = useState(initialData?.academicYear || ACADEMIC_YEARS[0])
  const [semester, setSemester] = useState(initialData?.semester || SEMESTERS[0])
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>(
    initialData?.departments.map((d) => d.id) ?? []
  )
  const [allYears, setAllYears] = useState(
    !!initialData && initialData.targetYears.length === 0
  )
  const [selectedYears, setSelectedYears] = useState<string[]>(
    initialData?.targetYears ?? []
  )

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const toggleYear = (year: string) => {
    setSelectedYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedDeptIds.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 แผนก")
      return
    }
    if (!allYears && selectedYears.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 ชั้นปี หรือเลือก \"ทุกชั้นปี\"")
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      academicYear,
      semester,
      targetYears: allYears ? [] : selectedYears,
      passThreshold: Number(formData.get("passThreshold")),
      departmentIds: selectedDeptIds,
    }

    try {
      const url = isEdit ? `/api/admin/vocational-activities/${initialData!.id}` : "/api/admin/vocational-activities"
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

      toast.success(isEdit ? "แก้ไขกิจกรรมเรียบร้อยแล้ว" : "เพิ่มกิจกรรมเรียบร้อยแล้ว")
      router.push("/admin/vocational-activities")
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
        <Label className="font-thai">ชื่อกิจกรรม *</Label>
        <Input
          name="name"
          defaultValue={initialData?.name}
          required
          className="font-thai"
          placeholder="เช่น กิจกรรมหน้าเสาธง"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-thai">ปีการศึกษา *</Label>
          <Select value={academicYear} onValueChange={setAcademicYear} required>
            <SelectTrigger className="font-thai">
              <SelectValue placeholder="เลือกปีการศึกษา" />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">ปีการศึกษา {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="font-thai">ภาคเรียน *</Label>
          <Select value={semester} onValueChange={setSemester} required>
            <SelectTrigger className="font-thai">
              <SelectValue placeholder="เลือกภาคเรียน" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s} className="font-thai">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">เกณฑ์ผ่าน (%) *</Label>
        <Input
          name="passThreshold"
          type="number"
          min={0}
          max={100}
          defaultValue={initialData?.passThreshold ?? DEFAULT_VOCATIONAL_PASS_THRESHOLD}
          required
          className="font-mono w-32"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">ชั้นปี *</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={allYears}>
            <Button
              type="button"
              variant="outline"
              disabled={allYears}
              className="w-full justify-between font-thai font-normal"
            >
              <span className={selectedYears.length === 0 && !allYears ? "text-muted-foreground" : ""}>
                {allYears ? "ทุกชั้นปี" : selectedYears.length === 0 ? "เลือกชั้นปี" : selectedYears.join(", ")}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-(--radix-dropdown-menu-trigger-width)">
            {YEARS.map((year) => (
              <DropdownMenuCheckboxItem
                key={year}
                checked={selectedYears.includes(year)}
                onCheckedChange={() => toggleYear(year)}
                onSelect={(e) => e.preventDefault()}
                className="font-thai"
              >
                {year}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="all-years"
            checked={allYears}
            onCheckedChange={(checked) => {
              setAllYears(!!checked)
              if (checked) setSelectedYears([])
            }}
          />
          <label htmlFor="all-years" className="text-sm font-thai cursor-pointer">ทุกชั้นปี</label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-thai">แผนกที่เกี่ยวข้อง *</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between font-thai font-normal">
              <span className={selectedDeptIds.length === 0 ? "text-muted-foreground" : ""}>
                {selectedDeptIds.length === 0
                  ? "เลือกแผนก"
                  : selectedDeptIds.length === departments.length
                    ? "ทุกแผนก"
                    : `เลือกแล้ว ${selectedDeptIds.length} แผนก`}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-(--radix-dropdown-menu-trigger-width) max-h-80 overflow-y-auto">
            <DropdownMenuCheckboxItem
              checked={selectedDeptIds.length === departments.length && departments.length > 0}
              onCheckedChange={(checked) => setSelectedDeptIds(checked ? departments.map((d) => d.id) : [])}
              onSelect={(e) => e.preventDefault()}
              className="font-thai font-medium"
            >
              เลือกทุกแผนก
            </DropdownMenuCheckboxItem>
            <div className="my-1 border-t" />
            {departments.map((dept) => (
              <DropdownMenuCheckboxItem
                key={dept.id}
                checked={selectedDeptIds.includes(dept.id)}
                onCheckedChange={() => toggleDept(dept.id)}
                onSelect={(e) => e.preventDefault()}
                className="font-thai"
              >
                {dept.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="text-xs text-gray-500 font-thai">
          เลือกได้หลายแผนกในครั้งเดียว ไม่ต้องสร้างกิจกรรมซ้ำทีละแผนก
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="font-thai gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "บันทึกการแก้ไข" : "เพิ่มกิจกรรม"}
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
