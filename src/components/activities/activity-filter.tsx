"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { YEARS, SEMESTERS, CATEGORY_NAMES } from "@/lib/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const STATUS_LABELS: Record<ActivityStatus, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

interface Filters {
  year?: string
  semester?: string
  category?: string
  status?: string
}

interface ActivityFilterProps {
  onFilterChange?: (filters: Filters) => void
  defaultYear?: string
}

export function ActivityFilter({ onFilterChange, defaultYear }: ActivityFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [year, setYear] = useState(searchParams.get("year") ?? defaultYear ?? "")
  const [semester, setSemester] = useState(searchParams.get("semester") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "")
  const [status, setStatus] = useState(searchParams.get("status") ?? "")

  const applyFilters = (newFilters: Filters) => {
    const params = new URLSearchParams()
    const merged = { year, semester, category, status, ...newFilters }
    if (merged.year) params.set("year", merged.year)
    if (merged.semester) params.set("semester", merged.semester)
    if (merged.category) params.set("category", merged.category)
    if (merged.status) params.set("status", merged.status)

    router.push(`${pathname}?${params.toString()}`)
    onFilterChange?.(merged)
  }

  const reset = () => {
    setYear(defaultYear ?? "")
    setSemester("")
    setCategory("")
    setStatus("")
    if (defaultYear) {
      router.push(`${pathname}?year=${encodeURIComponent(defaultYear)}`)
    } else {
      router.push(pathname)
    }
    onFilterChange?.({})
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-thai">ระดับชั้น</span>
        <Select
          value={year || "all"}
          onValueChange={(v) => {
            const val = v === "all" ? "" : v
            setYear(val)
            applyFilters({ year: val })
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-thai">ทั้งหมด</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y} className="font-thai">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-thai">ภาคเรียน</span>
        <Select
          value={semester || "all"}
          onValueChange={(v) => {
            const val = v === "all" ? "" : v
            setSemester(val)
            applyFilters({ semester: val })
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-thai">ทั้งหมด</SelectItem>
            {SEMESTERS.map((s) => (
              <SelectItem key={s} value={s} className="font-thai">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-thai">ประเภท</span>
        <Select
          value={category || "all"}
          onValueChange={(v) => {
            const val = v === "all" ? "" : v
            setCategory(val)
            applyFilters({ category: val })
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-thai">ทั้งหมด</SelectItem>
            {Object.values(ActivityCategory).map((c) => (
              <SelectItem key={c} value={c} className="font-thai">{CATEGORY_NAMES[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-thai">สถานะ</span>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            const val = v === "all" ? "" : v
            setStatus(val)
            applyFilters({ status: val })
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-thai">ทั้งหมด</SelectItem>
            {Object.values(ActivityStatus).map((s) => (
              <SelectItem key={s} value={s} className="font-thai">{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={reset} className="font-thai">
        ล้างตัวกรอง
      </Button>
    </div>
  )
}
