"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Eye } from "lucide-react"
import SummaryExportButtons from "@/components/admin/summary-export-buttons"

const VISIBLE_ACTIVITY_CHIPS = 2

interface SummaryGradeCardProps {
  year: string
  academicYear: string
  semester: string
  clubId?: string
  total: number
  passCount: number
  failCount: number
  pendingCount: number
  activityNames: string[]
}

export default function SummaryGradeCard({
  year,
  academicYear,
  semester,
  clubId,
  total,
  passCount,
  failCount,
  pendingCount,
  activityNames,
}: SummaryGradeCardProps) {
  const passPct = total > 0 ? Math.round((passCount / total) * 100) : 0
  const failPct = total > 0 ? Math.round((failCount / total) * 100) : 0
  const pendingPct = total > 0 ? Math.max(0, 100 - passPct - failPct) : 0

  const titleText = activityNames.length > 0 ? `กิจกรรม ${activityNames.length} รายการ` : "ยังไม่มีกิจกรรม"
  const visibleChips = activityNames.slice(0, VISIBLE_ACTIVITY_CHIPS)
  const remainingChips = activityNames.slice(VISIBLE_ACTIVITY_CHIPS)

  const detailParams = new URLSearchParams({ academicYear, semester, ...(clubId ? { club: clubId } : {}) })

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-thai font-semibold text-base truncate">{titleText}</span>
          <SummaryExportButtons year={year} academicYear={academicYear} semester={semester} clubId={clubId} />
        </div>

        {activityNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleChips.map((name) => (
              <Badge key={name} variant="outline" className="font-thai text-xs font-normal">
                {name}
              </Badge>
            ))}
            {remainingChips.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button">
                    <Badge
                      variant="outline"
                      className="font-thai text-xs font-normal text-primary-600 border-primary-200 hover:bg-primary-50 cursor-pointer"
                    >
                      +{remainingChips.length} เพิ่มเติม
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56">
                  <div className="flex flex-col gap-1.5">
                    {remainingChips.map((name) => (
                      <span key={name} className="text-xs font-thai text-gray-700">
                        {name}
                      </span>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-thai text-xs">{year}</Badge>
          <Badge variant="outline" className="font-thai text-xs">ทั้งหมด {total} คน</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-thai">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            ผ่าน: {passCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
            ไม่ผ่าน: {failCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            รอดำเนินการ: {pendingCount}
          </span>
        </div>

        <div className="space-y-1">
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex w-full">
            {passPct > 0 && <div className="h-full bg-success" style={{ width: `${passPct}%` }} />}
            {failPct > 0 && <div className="h-full bg-destructive" style={{ width: `${failPct}%` }} />}
            {pendingPct > 0 && <div className="h-full bg-gray-300" style={{ width: `${pendingPct}%` }} />}
          </div>
          <p className="text-xs font-mono text-gray-500 text-right">ผ่าน {passPct}%</p>
        </div>

        <Link href={`/admin/summary/${encodeURIComponent(year)}?${detailParams.toString()}`}>
          <Button variant="outline" className="w-full font-thai gap-2">
            <Eye className="w-4 h-4" />
            ดูรายละเอียด
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
