"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerTimeProps {
  label: string
  date?: Date
  time?: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  disabled?: boolean
  error?: string
}

export function DatePickerTime({
  label,
  date,
  time = "08:00",
  onDateChange,
  onTimeChange,
  disabled,
  error,
}: DatePickerTimeProps) {
  const [open, setOpen] = React.useState(false)
  const slug = label.replace(/\s+/g, "-")

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label htmlFor={`date-${slug}`} className="font-thai">{label} - วันที่</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                id={`date-${slug}`}
                disabled={disabled}
                className={cn("w-44 justify-between font-normal font-thai", error && "border-red-500")}
              >
                {date ? format(date, "dd/MM/yyyy") : "เลือกวันที่"}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                defaultMonth={date}
                onSelect={(selected) => {
                  onDateChange(selected)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5 w-32">
          <Label htmlFor={`time-${slug}`} className="font-thai">{label} - เวลา</Label>
          <Input
            type="time"
            id={`time-${slug}`}
            value={time}
            disabled={disabled}
            onChange={(e) => onTimeChange(e.target.value)}
            className={cn(error && "border-red-500")}
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500 font-thai">{error}</p>}
    </div>
  )
}
