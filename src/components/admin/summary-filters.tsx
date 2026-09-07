"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"
import { useState } from "react"
import { YEARS, ACADEMIC_YEARS, SEMESTERS } from "@/lib/constants"

const ALL_VALUE = "__all__"

interface Department {
  id: string
  name: string
}

interface SummaryFiltersProps {
  departments?: Department[]
}

export default function SummaryFilters({ departments }: SummaryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const academicYear = searchParams.get("academicYear") || ACADEMIC_YEARS[0]
  const semester = searchParams.get("semester") || SEMESTERS[0]
  const currentYear = searchParams.get("year") || ""
  const currentDepartment = searchParams.get("department") || ""

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/admin/summary?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchTerm)
  }

  const clearFilters = () => {
    setSearchTerm("")
    router.push("/admin/summary")
  }

  const hasFilters = currentYear || currentDepartment || searchTerm

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={academicYear} onValueChange={(v) => updateFilter("academicYear", v)}>
            <SelectTrigger className="w-40 font-thai">
              <SelectValue placeholder="ปีการศึกษา" />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">ปีการศึกษา {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={(v) => updateFilter("semester", v)}>
            <SelectTrigger className="w-40 font-thai">
              <SelectValue placeholder="ภาคเรียน" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s} className="font-thai">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <Input
              placeholder="ค้นหา รหัส, ชื่อ, นามสกุล"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 font-thai"
            />
            <Button type="submit" size="sm" className="gap-1.5 font-thai">
              <Search className="w-3.5 h-3.5" />
              ค้นหา
            </Button>
          </form>

          <Select value={currentYear || ALL_VALUE} onValueChange={(v) => updateFilter("year", v)}>
            <SelectTrigger className="w-36 font-thai">
              <SelectValue placeholder="ระดับชั้น" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE} className="font-thai">ทุกระดับชั้น</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {departments && (
            <Select value={currentDepartment || ALL_VALUE} onValueChange={(v) => updateFilter("department", v)}>
              <SelectTrigger className="w-48 font-thai">
                <SelectValue placeholder="แผนก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE} className="font-thai">ทุกแผนก</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name} className="font-thai">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 font-thai text-gray-500"
            >
              <X className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
