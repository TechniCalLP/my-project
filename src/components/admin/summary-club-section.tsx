"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import SummaryGradeCard from "@/components/admin/summary-grade-card"

const PREVIEW_COUNT = 3

interface CardData {
  year: string
  clubId: string
  activityId: string
  total: number
  passCount: number
  failCount: number
  pendingCount: number
  activityNames: string[]
}

interface SummaryClubSectionProps {
  clubName: string
  cards: CardData[]
  academicYear: string
  semester: string
}

export default function SummaryClubSection({ clubName, cards, academicYear, semester }: SummaryClubSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleCards = expanded ? cards : cards.slice(0, PREVIEW_COUNT)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-thai font-semibold text-base">ชมรม{clubName}</h2>
        {cards.length > PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary-600 font-thai hover:underline"
          >
            {expanded ? "ย่อ" : "แสดงทั้งหมด"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((c) => (
          <SummaryGradeCard
            key={`${c.clubId}::${c.year}::${c.activityId}`}
            year={c.year}
            academicYear={academicYear}
            semester={semester}
            clubId={c.clubId}
            total={c.total}
            passCount={c.passCount}
            failCount={c.failCount}
            pendingCount={c.pendingCount}
            activityNames={c.activityNames}
          />
        ))}
      </div>
    </div>
  )
}
