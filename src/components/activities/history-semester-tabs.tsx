"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory } from "@/generated/prisma"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  ACADEMIC: "bg-purple-100 text-purple-700",
  COMMUNITY_SERVICE: "bg-success/10 text-success",
  HEALTH: "bg-red-100 text-red-700",
  SCOUT: "bg-yellow-100 text-yellow-700",
}

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  ACADEMIC: "📚",
  COMMUNITY_SERVICE: "✨",
  HEALTH: "💪",
  SCOUT: "⛺",
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

function formatThaiDate(date: string): string {
  const d = new Date(date)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
}

interface ParticipationItem {
  id: string
  joinedAt: string
  codeUsed: string | null
  activity: {
    id: string
    name: string
    category: ActivityCategory
    targetYear: string
    targetSemester: string
    location: string | null
  }
}

interface HistorySemesterTabsProps {
  sem1: ParticipationItem[]
  sem2: ParticipationItem[]
  defaultSemester: string
}

function HistoryList({ items }: { items: ParticipationItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-2">📋</p>
        <p className="font-thai">ไม่มีประวัติในภาคเรียนนี้</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <Card key={p.id} className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-xl shrink-0">
                {CATEGORY_ICONS[p.activity.category]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold font-thai text-sm leading-snug">
                    {p.activity.name}
                  </p>
                  <Badge className={`${CATEGORY_COLORS[p.activity.category]} border-0 font-thai text-xs shrink-0`}>
                    {CATEGORY_NAMES[p.activity.category]}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 font-thai mt-0.5">
                  {p.activity.targetYear} • {p.activity.targetSemester}
                  {p.activity.location ? ` • ${p.activity.location}` : ""}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-success shrink-0" />
                    <p className="text-xs text-gray-500 font-thai">
                      เข้าร่วมเมื่อ {formatThaiDate(p.joinedAt)}
                    </p>
                  </div>
                  {p.codeUsed && (
                    <p className="text-xs text-gray-400 font-mono">
                      รหัส: {p.codeUsed}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function HistorySemesterTabs({ sem1, sem2, defaultSemester }: HistorySemesterTabsProps) {
  const [active, setActive] = useState(defaultSemester)
  const current = active === "ภาคเรียนที่ 1" ? sem1 : sem2

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(["ภาคเรียนที่ 1", "ภาคเรียนที่ 2"] as const).map((sem) => {
          const isActive = active === sem
          const count = sem === "ภาคเรียนที่ 1" ? sem1.length : sem2.length
          return (
            <button
              key={sem}
              onClick={() => setActive(sem)}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
                isActive
                  ? "bg-primary-500 border-primary-500 text-white shadow-lg"
                  : "bg-white border-gray-200 text-gray-700 hover:border-primary-300"
              )}
            >
              <span className="text-sm font-medium font-thai">{sem}</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", isActive ? "text-white" : "text-gray-900")}>
                  {count}
                </span>
                <span className={cn("text-xs font-thai", isActive ? "text-primary-100" : "text-gray-500")}>
                  กิจกรรม
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <HistoryList items={current} />
    </div>
  )
}
