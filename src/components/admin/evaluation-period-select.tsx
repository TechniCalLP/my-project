"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ACADEMIC_YEARS, SEMESTERS } from "@/lib/constants"

interface EvaluationPeriodSelectProps {
  academicYear: string
  semester: string
  basePath?: string
}

export default function EvaluationPeriodSelect({ academicYear, semester, basePath = "/admin/evaluation" }: EvaluationPeriodSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={academicYear} onValueChange={(v) => update("academicYear", v)}>
            <SelectTrigger className="w-40 font-thai">
              <SelectValue placeholder="ปีการศึกษา" />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map((y) => (
                <SelectItem key={y} value={y} className="font-thai">ปีการศึกษา {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={(v) => update("semester", v)}>
            <SelectTrigger className="w-40 font-thai">
              <SelectValue placeholder="ภาคเรียน" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s} className="font-thai">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
