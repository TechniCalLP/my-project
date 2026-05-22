"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"
import { useState } from "react"
import { YEARS, DEPARTMENTS } from "@/lib/constants"

const ALL_VALUE = "__all__"

export default function StudentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const currentYear = searchParams.get("year") || ""
  const currentDepartment = searchParams.get("department") || ""
  const currentStatus = searchParams.get("status") || ""

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    router.push(`/admin/students?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchTerm)
  }

  const clearFilters = () => {
    setSearchTerm("")
    router.push("/admin/students")
  }

  const hasFilters = currentYear || currentDepartment || currentStatus || searchTerm

  return (
    <Card>
      <CardContent className="pt-4">
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

          <Select value={currentDepartment || ALL_VALUE} onValueChange={(v) => updateFilter("department", v)}>
            <SelectTrigger className="w-48 font-thai">
              <SelectValue placeholder="แผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE} className="font-thai">ทุกแผนก</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d} className="font-thai">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentStatus || ALL_VALUE} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="w-40 font-thai">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE} className="font-thai">ทุกสถานะ</SelectItem>
              <SelectItem value="active" className="font-thai">ใช้งาน</SelectItem>
              <SelectItem value="inactive" className="font-thai">ปิดการใช้งาน</SelectItem>
            </SelectContent>
          </Select>

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
