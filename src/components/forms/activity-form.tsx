"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { toast } from "sonner"
import { activitySchema, type ActivityInput } from "@/lib/validations"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { DEPARTMENTS, YEARS, SEMESTERS, CATEGORY_NAMES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerTime } from "@/components/ui/date-picker-time"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Activity {
  id: string
  name: string
  description?: string | null
  category: ActivityCategory
  targetYear: string
  targetSemester: string
  targetDepartments: string[]
  startDate: Date | string
  endDate: Date | string
  location?: string | null
  maxSlots?: number | null
  status: ActivityStatus
}

interface ActivityFormProps {
  activity?: Activity
  onSuccess?: () => void
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  DRAFT: "ร่าง",
  ACTIVE: "เปิดรับสมัคร",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

function toDateObj(val: Date | string | undefined): Date | undefined {
  if (!val) return undefined
  const d = new Date(val)
  return isNaN(d.getTime()) ? undefined : d
}

function toTimeStr(val: Date | string | undefined): string {
  if (!val) return "08:00"
  const d = new Date(val)
  if (isNaN(d.getTime())) return "08:00"
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function combineDatetime(date: Date | undefined, time: string): string {
  if (!date) return ""
  const [h, m] = time.split(":").map(Number)
  const d = new Date(date)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.toISOString()
}

export function ActivityForm({ activity, onSuccess }: ActivityFormProps) {
  const [loading, setLoading] = useState(false)
  const [allDepts, setAllDepts] = useState(
    !activity || activity.targetDepartments.length === 0
  )
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    activity?.targetDepartments ?? []
  )
  const [startDate, setStartDate] = useState<Date | undefined>(toDateObj(activity?.startDate))
  const [startTime, setStartTime] = useState(toTimeStr(activity?.startDate))
  const [endDate, setEndDate] = useState<Date | undefined>(toDateObj(activity?.endDate))
  const [endTime, setEndTime] = useState(toTimeStr(activity?.endDate))

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ActivityInput>({
    resolver: standardSchemaResolver(activitySchema),
    defaultValues: {
      name: activity?.name ?? "",
      description: activity?.description ?? "",
      category: activity?.category ?? ActivityCategory.ACADEMIC,
      targetYear: activity?.targetYear ?? "",
      targetSemester: activity?.targetSemester ?? "",
      targetDepartments: activity?.targetDepartments ?? [],
      startDate: combineDatetime(toDateObj(activity?.startDate), toTimeStr(activity?.startDate)),
      endDate: combineDatetime(toDateObj(activity?.endDate), toTimeStr(activity?.endDate)),
      location: activity?.location ?? "",
      maxSlots: activity?.maxSlots ?? undefined,
      status: activity?.status ?? ActivityStatus.DRAFT,
    },
  })

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    setValue("startDate", combineDatetime(date, startTime))
  }
  const handleStartTimeChange = (time: string) => {
    setStartTime(time)
    setValue("startDate", combineDatetime(startDate, time))
  }
  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    setValue("endDate", combineDatetime(date, endTime))
  }
  const handleEndTimeChange = (time: string) => {
    setEndTime(time)
    setValue("endDate", combineDatetime(endDate, time))
  }

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) => {
      const next = prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
      setValue("targetDepartments", next)
      return next
    })
  }

  const onSubmit = async (data: ActivityInput) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        targetDepartments: allDepts ? [] : selectedDepts,
        maxSlots: data.maxSlots ?? null,
      }

      const url = activity ? `/api/activities/${activity.id}` : "/api/activities"
      const method = activity ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }

      toast.success(activity ? "อัปเดตกิจกรรมสำเร็จ" : "สร้างกิจกรรมสำเร็จ")
      onSuccess?.()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-thai">ชื่อกิจกรรม *</Label>
        <Input id="name" {...register("name")} disabled={loading} />
        {errors.name && <p className="text-sm text-red-500 font-thai">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-thai">รายละเอียด</Label>
        <textarea
          id="description"
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("description")}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-thai">ประเภทกิจกรรม *</Label>
          <Select
            defaultValue={activity?.category ?? ActivityCategory.ACADEMIC}
            onValueChange={(v) => setValue("category", v as ActivityCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ActivityCategory).map((cat) => (
                <SelectItem key={cat} value={cat} className="font-thai">
                  {CATEGORY_NAMES[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500 font-thai">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="font-thai">สถานะ *</Label>
          <Select
            defaultValue={activity?.status ?? ActivityStatus.DRAFT}
            onValueChange={(v) => setValue("status", v as ActivityStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ActivityStatus).map((s) => (
                <SelectItem key={s} value={s} className="font-thai">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-thai">ระดับชั้น *</Label>
          <Select
            defaultValue={activity?.targetYear ?? ""}
            onValueChange={(v) => setValue("targetYear", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกระดับชั้น" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.targetYear && <p className="text-sm text-red-500 font-thai">{errors.targetYear.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="font-thai">ภาคเรียน *</Label>
          <Select
            defaultValue={activity?.targetSemester ?? ""}
            onValueChange={(v) => setValue("targetSemester", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกภาคเรียน" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s} className="font-thai">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.targetSemester && <p className="text-sm text-red-500 font-thai">{errors.targetSemester.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="font-thai">แผนก</Label>
        <div className="flex items-center gap-2 mb-2">
          <Checkbox
            id="all-depts"
            checked={allDepts}
            onCheckedChange={(checked) => {
              setAllDepts(!!checked)
              if (checked) {
                setSelectedDepts([])
                setValue("targetDepartments", [])
              }
            }}
          />
          <label htmlFor="all-depts" className="text-sm font-thai cursor-pointer">ทุกแผนก</label>
        </div>
        {!allDepts && (
          <div className="grid grid-cols-2 gap-2">
            {DEPARTMENTS.map((dept) => (
              <div key={dept} className="flex items-center gap-2">
                <Checkbox
                  id={`dept-${dept}`}
                  checked={selectedDepts.includes(dept)}
                  onCheckedChange={() => toggleDept(dept)}
                />
                <label htmlFor={`dept-${dept}`} className="text-sm font-thai cursor-pointer">{dept}</label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DatePickerTime
          label="วันเริ่มต้น"
          date={startDate}
          time={startTime}
          onDateChange={handleStartDateChange}
          onTimeChange={handleStartTimeChange}
          disabled={loading}
          error={errors.startDate?.message}
        />
        <DatePickerTime
          label="วันสิ้นสุด"
          date={endDate}
          time={endTime}
          onDateChange={handleEndDateChange}
          onTimeChange={handleEndTimeChange}
          disabled={loading}
          error={errors.endDate?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="font-thai">สถานที่</Label>
          <Input id="location" {...register("location")} disabled={loading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxSlots" className="font-thai">จำนวนที่นั่งสูงสุด</Label>
          <Input id="maxSlots" type="number" {...register("maxSlots", { valueAsNumber: true })} disabled={loading} />
        </div>
      </div>

      <Button type="submit" className="w-full font-thai" disabled={loading}>
        {loading ? "กำลังบันทึก..." : activity ? "อัปเดตกิจกรรม" : "สร้างกิจกรรม"}
      </Button>
    </form>
  )
}
