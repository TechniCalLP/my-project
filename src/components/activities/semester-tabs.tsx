"use client"

import { useState } from "react"
import { ActivityCard } from "@/components/activities/activity-card"
import { cn } from "@/lib/utils"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"

interface Activity {
  id: string
  name: string
  description?: string | null
  category: ActivityCategory
  targetYear: string
  targetSemester: string
  startDate: Date | string
  endDate: Date | string
  location?: string | null
  maxSlots?: number | null
  status: ActivityStatus
  _count?: { participations: number }
  isJoined: boolean
}

interface SemesterTabsProps {
  sem1: Activity[]
  sem2: Activity[]
  defaultSemester: string
  variant?: "default" | "compact"
  cols?: 2 | 3
}

export function SemesterTabs({
  sem1,
  sem2,
  defaultSemester,
  variant = "default",
  cols = 3,
}: SemesterTabsProps) {
  const [active, setActive] = useState(defaultSemester)
  const current = active === "ภาคเรียนที่ 1" ? sem1 : sem2

  return (
    <div className="space-y-4">
      {/* Card-style tab buttons */}
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
                <span
                  className={cn(
                    "text-2xl font-bold",
                    isActive ? "text-white" : "text-gray-900"
                  )}
                >
                  {count}
                </span>
                <span
                  className={cn(
                    "text-xs font-thai",
                    isActive ? "text-primary-100" : "text-gray-500"
                  )}
                >
                  กิจกรรม
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Content */}
      {current.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-thai">ไม่มีกิจกรรมในภาคเรียนนี้</p>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            cols === 3
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
          )}
        >
          {current.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isJoined={activity.isJoined}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  )
}
