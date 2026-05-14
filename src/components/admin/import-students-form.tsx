"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, Loader2, CheckCircle2, XCircle, Download, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface StudentRow {
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  department: string
  year: string
  email?: string
  phone?: string
  status: "pending" | "success" | "error"
  error?: string
}

const YEAR_MAP: Record<string, string> = {
  "1": "ปวช.1", "2": "ปวช.2", "3": "ปวช.3", "4": "ปวส.1", "5": "ปวส.2",
}

function normalizeYear(raw: string): string {
  const trimmed = raw.trim()
  return YEAR_MAP[trimmed] ?? trimmed
}

function calculateYearFromStudentId(studentId: string): number {
  if (!studentId || studentId.length < 2) return 1
  const enrollYear = parseInt(studentId.substring(0, 2))
  const currentYearShort = (new Date().getFullYear() + 543) % 100
  let yearsStudied = currentYearShort - enrollYear
  if (yearsStudied < 0) yearsStudied += 100
  const year = yearsStudied + 1
  return Math.min(Math.max(year, 1), 5)
}

function parseCSV(text: string): StudentRow[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")
  if (lines.length < 2) throw new Error("ไฟล์ต้องมีอย่างน้อย 2 บรรทัด (Header + Data)")

  return lines
    .slice(1)
    .map((line, idx) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

      if (values.length === 0 || !values[0]) return null

      let studentId: string, firstName: string, lastName: string, department: string, yearNum: number

      if (values.length === 5) {
        // รูปแบบมาตรฐาน: studentId, firstName, lastName, department, year
        ;[studentId, firstName, lastName, department] = values
        yearNum = parseInt(values[4])
        if (!studentId || !firstName || !lastName || !department || isNaN(yearNum)) {
          throw new Error(`บรรทัดที่ ${idx + 2}: ข้อมูลไม่ครบ`)
        }
      } else if (values.length > 5) {
        // รูปแบบเช็คชื่อ: เลขที่, studentId, firstName, lastName, department, คาบ1-20...
        studentId = values[1]
        firstName = values[2]
        lastName = values[3]
        department = values[4]
        if (!studentId || !firstName || !lastName || !department) {
          throw new Error(`บรรทัดที่ ${idx + 2}: ข้อมูลไม่ครบ (ต้องมีรหัส, ชื่อ, นามสกุล, แผนก)`)
        }
        yearNum = calculateYearFromStudentId(studentId)
      } else {
        throw new Error(`บรรทัดที่ ${idx + 2}: รูปแบบไฟล์ไม่ถูกต้อง (พบ ${values.length} คอลัมน์)`)
      }

      return {
        studentId,
        prefix: "นาย",
        firstName,
        lastName,
        department,
        year: normalizeYear(String(yearNum)),
        email: undefined,
        phone: undefined,
        status: "pending" as const,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null) as StudentRow[]
}

export default function ImportStudentsForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<StudentRow[]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const valid = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    if (!valid.includes(file.type) && !file.name.endsWith(".csv")) {
      toast.error("กรุณาเลือกไฟล์ CSV เท่านั้น")
      return
    }

    setFileName(file.name)
    setFileSize(file.size)
    setLoading(true)
    setPreview([])

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length === 0) throw new Error("ไม่พบข้อมูลในไฟล์")
      setPreview(rows)
      toast.success(`อ่านไฟล์สำเร็จ — พบข้อมูล ${rows.length} รายการ`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ได้"
      toast.error(msg)
      setFileName("")
      if (inputRef.current) inputRef.current.value = ""
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    if (!confirm(`ต้องการ Import นักศึกษา ${preview.length} คน ใช่หรือไม่?`)) return

    setImporting(true)
    try {
      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: preview }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Import failed")

      const msg = result.failed > 0
        ? `Import สำเร็จ ${result.success} คน, ล้มเหลว ${result.failed} คน`
        : `Import นักศึกษา ${result.success} คน สำเร็จ`
      toast.success(msg)

      setPreview(result.results)

      if (result.failed === 0) {
        setTimeout(() => {
          router.push("/admin/students")
          router.refresh()
        }, 1500)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถ Import ได้"
      toast.error(msg)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csv = [
      "studentId,firstName,lastName,department,year",
      "66011234,สมชาย,ใจดี,เทคนิคคอมพิวเตอร์,ปวช.1",
      "66011235,สมหญิง,รักเรียน,ช่างยนต์,ปวช.2",
      "66011236,สมศักดิ์,มานะ,ช่างไฟฟ้า,ปวส.1",
      "66011237,สมปอง,ขยัน,อิเล็กทรอนิกส์,ปวส.2",
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = preview.filter((r) => r.status === "success").length
  const errorCount = preview.filter((r) => r.status === "error").length

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-full border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
              ) : (
                <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="font-thai text-sm text-gray-600">
                {fileName ? (
                  <span className="font-medium text-gray-800">
                    {fileName} ({(fileSize / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  "คลิกเพื่อเลือกไฟล์ CSV"
                )}
              </p>
              <p className="text-xs text-gray-400 font-thai mt-1">รองรับเฉพาะไฟล์ .csv</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="font-thai gap-2 self-start"
            >
              <Download className="w-3.5 h-3.5" />
              ดาวน์โหลดไฟล์ตัวอย่าง
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-thai text-base">
              ตัวอย่างข้อมูล ({preview.length} รายการ)
              {successCount > 0 && (
                <span className="ml-2 text-success text-sm font-normal">
                  สำเร็จ {successCount}
                </span>
              )}
              {errorCount > 0 && (
                <span className="ml-2 text-secondary-600 text-sm font-normal">
                  ล้มเหลว {errorCount}
                </span>
              )}
            </CardTitle>
            <Button
              onClick={handleImport}
              disabled={importing || preview.every((r) => r.status !== "pending")}
              className="font-thai gap-2"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {importing ? "กำลัง Import..." : "Import ทั้งหมด"}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-thai w-10">#</TableHead>
                    <TableHead className="font-thai">รหัส</TableHead>
                    <TableHead className="font-thai">ชื่อ</TableHead>
                    <TableHead className="font-thai">นามสกุล</TableHead>
                    <TableHead className="font-thai">แผนก</TableHead>
                    <TableHead className="font-thai">ชั้นปี</TableHead>
                    <TableHead className="font-thai">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={row.status === "error" ? "bg-red-50" : row.status === "success" ? "bg-green-50" : ""}
                    >
                      <TableCell className="text-gray-400 text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{row.studentId}</TableCell>
                      <TableCell className="font-thai text-sm">{row.firstName}</TableCell>
                      <TableCell className="font-thai text-sm">{row.lastName}</TableCell>
                      <TableCell className="font-thai text-sm">{row.department}</TableCell>
                      <TableCell className="font-thai text-sm">{row.year}</TableCell>
                      <TableCell>
                        {row.status === "pending" && (
                          <Badge className="bg-gray-100 text-gray-500 border-0 font-thai text-xs">
                            รอ Import
                          </Badge>
                        )}
                        {row.status === "success" && (
                          <span className="flex items-center gap-1 text-success text-xs font-thai">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            สำเร็จ
                          </span>
                        )}
                        {row.status === "error" && (
                          <span className="flex items-center gap-1 text-secondary-600 text-xs font-thai">
                            <XCircle className="w-3.5 h-3.5" />
                            {row.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
