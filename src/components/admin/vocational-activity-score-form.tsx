"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface StudentRow {
  id: string
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  year: string
  group: string | null
  score: number | null
}

interface VocationalActivityScoreFormProps {
  activityId: string
  students: StudentRow[]
}

const NO_GROUP_LABEL = "ไม่ระบุกลุ่ม"

export default function VocationalActivityScoreForm({ activityId, students }: VocationalActivityScoreFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.id, s.score?.toString() ?? ""]))
  )
  const [saving, setSaving] = useState(false)

  const setValue = (studentId: string, value: string) => {
    setValues((prev) => ({ ...prev, [studentId]: value }))
  }

  // group headers: insert a subheader row whenever year or group changes (students already sorted by year, group, studentId)
  const rowsWithHeaders = useMemo(() => {
    const result: Array<{ kind: "header"; key: string; label: string } | { kind: "student"; student: StudentRow }> = []
    let lastYear: string | null = null
    let lastGroup: string | null | undefined = undefined
    for (const s of students) {
      const groupLabel = s.group ?? NO_GROUP_LABEL
      if (s.year !== lastYear || s.group !== lastGroup) {
        result.push({ kind: "header", key: `${s.year}-${groupLabel}`, label: `${s.year} · กลุ่ม ${groupLabel}` })
        lastYear = s.year
        lastGroup = s.group
      }
      result.push({ kind: "student", student: s })
    }
    return result
  }, [students])

  const handleSaveAll = async () => {
    const scores: { studentId: string; score: number }[] = []
    for (const s of students) {
      const raw = values[s.id]
      if (raw === undefined || raw === "") continue
      const num = Number(raw)
      if (Number.isNaN(num) || num < 0 || num > 100) {
        toast.error(`คะแนนของ ${s.prefix}${s.firstName} ${s.lastName} ต้องอยู่ระหว่าง 0-100`)
        return
      }
      scores.push({ studentId: s.id, score: num })
    }

    if (scores.length === 0) {
      toast.error("กรุณากรอกคะแนนอย่างน้อย 1 คน")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/teacher/vocational-activities/${activityId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      toast.success(`บันทึกคะแนนสำเร็จ ${scores.length} คน`)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500 font-thai">
          ไม่พบนักศึกษา
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai whitespace-nowrap">รหัสนักศึกษา</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">ชื่อ-นามสกุล</TableHead>
                  <TableHead className="font-thai whitespace-nowrap">คะแนน (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsWithHeaders.map((row) =>
                  row.kind === "header" ? (
                    <TableRow key={row.key} className="bg-gray-50 hover:bg-gray-50">
                      <TableCell colSpan={3} className="font-thai font-medium text-sm text-gray-600 py-2">
                        {row.label}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={row.student.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{row.student.studentId}</TableCell>
                      <TableCell className="font-thai">
                        {row.student.prefix}{row.student.firstName} {row.student.lastName}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={values[row.student.id] ?? ""}
                          onChange={(e) => setValue(row.student.id, e.target.value)}
                          className="w-24 font-mono"
                        />
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveAll} disabled={saving} className="font-thai gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        บันทึกคะแนนทั้งหมด
      </Button>
    </div>
  )
}
