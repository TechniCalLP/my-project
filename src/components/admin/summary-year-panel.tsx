"use client"

import { useState } from "react"
import SummaryExportButtons from "@/components/admin/summary-export-buttons"
import SummaryCorrectionRequest from "@/components/admin/summary-correction-request"
import SummaryYearDetail, { type StudentRow } from "@/components/admin/summary-year-detail"

interface SummaryYearPanelProps {
  year: string
  academicYear: string
  semester: string
  isAdminView: boolean
  clubId?: string
  activityId?: string
  activityName?: string
}

export default function SummaryYearPanel({ year, academicYear, semester, isAdminView, clubId, activityId, activityName }: SummaryYearPanelProps) {
  const [selected, setSelected] = useState<Map<string, StudentRow>>(new Map())

  const toggleRow = (row: StudentRow) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(row.id)) next.delete(row.id)
      else next.set(row.id, row)
      return next
    })
  }

  const toggleAllVisible = (rows: StudentRow[]) => {
    setSelected((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.has(r.id))
      const next = new Map(prev)
      for (const row of rows) {
        if (allSelected) next.delete(row.id)
        else next.set(row.id, row)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <SummaryExportButtons year={year} academicYear={academicYear} semester={semester} clubId={clubId} />
        {!isAdminView && (
          <SummaryCorrectionRequest
            year={year}
            academicYear={academicYear}
            selectedRows={[...selected.values()]}
            onSubmitted={() => setSelected(new Map())}
          />
        )}
      </div>

      <SummaryYearDetail
        year={year}
        academicYear={academicYear}
        semester={semester}
        isAdminView={isAdminView}
        clubId={clubId}
        activityId={activityId}
        activityName={activityName}
        selectedIds={isAdminView ? undefined : new Set(selected.keys())}
        onToggleRow={isAdminView ? undefined : toggleRow}
        onToggleAllVisible={isAdminView ? undefined : toggleAllVisible}
      />
    </div>
  )
}
