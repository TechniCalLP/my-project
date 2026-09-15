"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ChevronDown, Loader2 } from "lucide-react"
import SummaryExportButtons from "@/components/admin/summary-export-buttons"

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

interface StudentRow {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
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

  const [studentsOpen, setStudentsOpen] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [students, setStudents] = useState<StudentRow[] | null>(null)
  const [studentsTotal, setStudentsTotal] = useState(0)

  const detailParams = new URLSearchParams({ academicYear, semester, ...(clubId ? { club: clubId } : {}) })

  const toggleStudents = async () => {
    const next = !studentsOpen
    setStudentsOpen(next)
    if (!next || students !== null) return
    setLoadingStudents(true)
    try {
      const params = new URLSearchParams({ year, academicYear, semester, ...(clubId ? { club: clubId } : {}) })
      const res = await fetch(`/api/admin/summary/students?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data.rows)
        setStudentsTotal(data.total)
      }
    } finally {
      setLoadingStudents(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="font-thai font-semibold text-base truncate">{year}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-thai text-xs">{total} คน</Badge>
              <Badge variant="outline" className="font-thai text-xs">{activityNames.length} กิจกรรม</Badge>
            </div>
          </div>
          <SummaryExportButtons year={year} academicYear={academicYear} semester={semester} clubId={clubId} />
        </div>

        {activityNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activityNames.map((name) => (
              <Badge key={name} variant="outline" className="font-thai text-[10px] font-normal text-gray-500 bg-gray-50">
                {name}
              </Badge>
            ))}
          </div>
        )}

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

        <div className="border rounded-md">
          <button
            type="button"
            onClick={toggleStudents}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-thai text-gray-600 hover:bg-gray-50"
          >
            <span>รายชื่อนักศึกษา</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${studentsOpen ? "rotate-180" : ""}`} />
          </button>
          {studentsOpen && (
            <div className="border-t px-3 py-2 max-h-48 overflow-y-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-3 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : students && students.length > 0 ? (
                <ul className="space-y-1">
                  {students.map((s) => (
                    <li key={s.id} className="text-xs font-thai text-gray-600 flex justify-between gap-2">
                      <span className="truncate">{s.prefix}{s.firstName} {s.lastName}</span>
                      <span className="font-mono text-gray-400 shrink-0">{s.studentId}</span>
                    </li>
                  ))}
                  {studentsTotal > students.length && (
                    <li className="text-xs text-gray-400 font-thai pt-1">
                      และอีก {studentsTotal - students.length} คน — ดูทั้งหมดที่ &ldquo;ดูรายละเอียด&rdquo;
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 font-thai py-2 text-center">ไม่พบนักศึกษา</p>
              )}
            </div>
          )}
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
