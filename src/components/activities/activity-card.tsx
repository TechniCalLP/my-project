import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { CATEGORY_NAMES } from "@/lib/constants"
import { CheckCircle2, Calendar, MapPin, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityCardProps {
  activity: {
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
  }
  isJoined?: boolean
  variant?: "default" | "compact"
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  ACADEMIC: "bg-primary-100 text-primary-700 border-primary-200",
  COMMUNITY_SERVICE: "bg-success/10 text-success border-success/20",
  HEALTH: "bg-secondary-100 text-secondary-700 border-secondary-200",
  SCOUT: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

const STATUS_COLORS: Record<ActivityStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-gray-100 text-gray-600 border-gray-200",
  DRAFT: "bg-orange-100 text-orange-700 border-orange-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "ปิดแล้ว",
  DRAFT: "ร่าง",
  CANCELLED: "ยกเลิก",
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

function formatThaiDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const fmt = (d: Date) =>
    `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`

  if (start.toDateString() === end.toDateString()) return fmt(start)

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}-${end.getDate()} ${THAI_MONTHS[start.getMonth()]} ${start.getFullYear() + 543}`
  }

  return `${fmt(start)} - ${fmt(end)}`
}

export function ActivityCard({ activity, isJoined, variant = "default" }: ActivityCardProps) {
  const isActive = activity.status === ActivityStatus.ACTIVE
  const dateRange = formatThaiDateRange(activity.startDate, activity.endDate)

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow border-l-4",
        isActive ? "border-l-primary-500" : "border-l-gray-300",
        isJoined && "bg-primary-50/30"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-thai line-clamp-2 leading-snug">
            {activity.name}
          </CardTitle>
          {isJoined ? (
            <div className="flex items-center gap-1 text-success shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-thai font-medium">เข้าร่วมแล้ว</span>
            </div>
          ) : (
            <Badge className={`${STATUS_COLORS[activity.status]} border text-xs shrink-0 font-thai`}>
              {STATUS_LABELS[activity.status]}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <Badge className={`${CATEGORY_COLORS[activity.category]} border text-xs font-thai`}>
            {CATEGORY_NAMES[activity.category]}
          </Badge>
          <span className="text-xs text-gray-500 font-thai">
            {activity.targetYear} • {activity.targetSemester}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {variant === "default" && activity.description && (
          <p className="text-sm text-gray-600 line-clamp-2 font-thai">{activity.description}</p>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1.5 font-thai">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{dateRange}</span>
          </div>
          {activity.location && (
            <div className="flex items-center gap-1.5 font-thai">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{activity.location}</span>
            </div>
          )}
          {variant === "default" && activity._count !== undefined && (
            <div className="flex items-center gap-1.5 font-thai">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>
                {activity._count.participations}
                {activity.maxSlots ? ` / ${activity.maxSlots}` : ""} คน
              </span>
            </div>
          )}
        </div>

        {!isJoined && isActive && (
          <div className="pt-1">
            <Link href="/join">
              <Button size={variant === "compact" ? "sm" : "sm"} className="w-full font-thai">
                เข้าร่วมด้วยโค้ด
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
