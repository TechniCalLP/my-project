"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { YEARS, SEMESTERS, CATEGORY_NAMES } from "@/lib/constants"
import { ActivityStatus } from "@/generated/prisma"

const STATUS_LABELS: Record<ActivityStatus, string> = {
  DRAFT: "ร่าง",
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

const ALL_VALUE = "__all__"

export default function ActivityFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentYear = searchParams.get("year") ?? ""
  const currentSemester = searchParams.get("semester") ?? ""
  const currentCategory = searchParams.get("category") ?? ""
  const currentStatus = searchParams.get("status") ?? ""

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/activities?${params.toString()}`)
  }

  const hasFilters = currentYear || currentSemester || currentCategory || currentStatus

  return (
    <div className="flex flex-wrap gap-3 items-center">
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

      <Select value={currentSemester || ALL_VALUE} onValueChange={(v) => updateFilter("semester", v)}>
        <SelectTrigger className="w-40 font-thai">
          <SelectValue placeholder="ภาคเรียน" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE} className="font-thai">ทุกภาคเรียน</SelectItem>
          {SEMESTERS.map((s) => (
            <SelectItem key={s} value={s} className="font-thai">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentCategory || ALL_VALUE} onValueChange={(v) => updateFilter("category", v)}>
        <SelectTrigger className="w-44 font-thai">
          <SelectValue placeholder="ประเภท" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE} className="font-thai">ทุกประเภท</SelectItem>
          {(Object.entries(CATEGORY_NAMES) as [string, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key} className="font-thai">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentStatus || ALL_VALUE} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-40 font-thai">
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE} className="font-thai">ทุกสถานะ</SelectItem>
          {(Object.entries(STATUS_LABELS) as [ActivityStatus, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key} className="font-thai">{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/activities")}
          className="gap-1.5 font-thai text-gray-500"
        >
          <X className="w-3.5 h-3.5" />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}
