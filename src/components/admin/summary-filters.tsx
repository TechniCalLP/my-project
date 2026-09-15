"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import EvaluationPeriodSelect from "@/components/admin/evaluation-period-select"
import SummaryClubFilter from "@/components/admin/summary-club-filter"

const ALL_VALUE = "__all__"

interface SummaryFiltersProps {
  academicYear: string
  semester: string
  isTeacher: boolean
  clubs: { id: string; name: string }[]
}

export default function SummaryFilters({ academicYear, semester, isTeacher, clubs }: SummaryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const currentStatus = searchParams.get("status") ?? ""

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/summary?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchTerm)
  }

  const hasFilters = searchTerm || currentStatus || searchParams.get("club")

  const clearFilters = () => {
    setSearchTerm("")
    router.push("/admin/summary")
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="ค้นหาชื่อชมรม หรือกิจกรรม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 font-thai"
              />
            </div>
            <Button type="submit" size="sm" className="gap-1.5 font-thai shrink-0">
              <Search className="w-3.5 h-3.5" />
              ค้นหา
            </Button>
          </form>

          <EvaluationPeriodSelect academicYear={academicYear} semester={semester} basePath="/admin/summary" wrapInCard={false} />

          {!isTeacher && <SummaryClubFilter clubs={clubs} />}

          <Select value={currentStatus || ALL_VALUE} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="w-44 font-thai">
              <SelectValue placeholder="สถานะประเมิน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE} className="font-thai">แสดงผลทั้งหมด</SelectItem>
              <SelectItem value="pass" className="font-thai">มีผู้ผ่านเกณฑ์</SelectItem>
              <SelectItem value="fail" className="font-thai">มีผู้ไม่ผ่านเกณฑ์</SelectItem>
              <SelectItem value="pending" className="font-thai">มีผู้รอดำเนินการ</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 font-thai text-gray-500">
              <X className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
