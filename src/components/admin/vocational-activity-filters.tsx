"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search } from "lucide-react"
import { useState } from "react"
import { ACADEMIC_YEARS } from "@/lib/constants"

const ALL_VALUE = "__all__"

export default function VocationalActivityFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const currentYear = searchParams.get("academicYear") ?? ""

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/vocational-activities?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchTerm)
  }

  const hasFilters = searchTerm || currentYear

  const clearFilters = () => {
    setSearchTerm("")
    router.push("/admin/vocational-activities")
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <Input
              placeholder="ค้นหาชื่อกิจกรรม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 font-thai"
            />
            <Button type="submit" size="sm" className="gap-1.5 font-thai">
              <Search className="w-3.5 h-3.5" />
              ค้นหา
            </Button>
          </form>

          <Select value={currentYear || ALL_VALUE} onValueChange={(v) => updateFilter("academicYear", v)}>
            <SelectTrigger className="w-44 font-thai">
              <SelectValue placeholder="ปีการศึกษา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE} className="font-thai">ทุกปีการศึกษา</SelectItem>
              {ACADEMIC_YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">ปีการศึกษา {y}</SelectItem>
              ))}
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
