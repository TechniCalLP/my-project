import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import SummaryExportButtons from "@/components/admin/summary-export-buttons"

interface SummaryGradeCardProps {
  year: string
  academicYear: string
  semester: string
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
  total,
  passCount,
  failCount,
  pendingCount,
  activityNames,
}: SummaryGradeCardProps) {
  const passPct = total > 0 ? Math.round((passCount / total) * 100) : 0
  const failPct = total > 0 ? Math.round((failCount / total) * 100) : 0
  const pendingPct = total > 0 ? Math.max(0, 100 - passPct - failPct) : 0

  const detailParams = new URLSearchParams({ academicYear, semester })

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-thai font-semibold text-base">{activityNames.join(", ")}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-thai text-xs">{year}</Badge>
              <Badge variant="outline" className="font-thai text-xs">{total} คน</Badge>
            </div>
          </div>
          <SummaryExportButtons year={year} academicYear={academicYear} semester={semester} />
        </div>

        <p className="text-xs text-gray-400 font-thai">
          ผ่าน {passCount} · ไม่ผ่าน {failCount} · รอดำเนินการ {pendingCount}
        </p>

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
