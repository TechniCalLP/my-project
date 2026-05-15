"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, Loader2, FileSpreadsheet, AlertCircle, Download, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface StudentPreview {
  studentId: string
  firstName: string
  lastName: string
  department: string
  year: number
}

interface ImportError {
  row: number
  error: string
  data?: unknown
}

const YEAR_DISPLAY: Record<number, string> = {
  1: "ปวช.1", 2: "ปวช.2", 3: "ปวช.3", 4: "ปวส.1", 5: "ปวส.2",
}

export default function ImportStudentsForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<StudentPreview[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewErrors, setPreviewErrors] = useState<ImportError[]>([])
  const [importResult, setImportResult] = useState<{
    summary: { total: number; success: number; failed: number }
    errors: ImportError[]
  } | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setStep("upload")
      setPreview([])
      setPreviewErrors([])
      setImportResult(null)
    }
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mode", "preview")

      const res = await fetch("/api/admin/students/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

      if (data.total === 0) throw new Error("ไม่พบข้อมูลนักศึกษาในไฟล์")

      setPreview(data.preview || [])
      setPreviewTotal(data.total || 0)
      setPreviewErrors(data.errors || [])
      setStep("preview")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถอ่านไฟล์ได้")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    if (!confirm(`ต้องการ Import นักศึกษา ${previewTotal} คน ใช่หรือไม่?`)) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mode", "import")

      const res = await fetch("/api/admin/students/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

      setImportResult(data)
      setStep("result")

      if (data.summary.failed === 0) {
        toast.success(`Import สำเร็จ ${data.summary.success} คน`)
      } else {
        toast.success(`Import ${data.summary.success} คน สำเร็จ, ล้มเหลว ${data.summary.failed} คน`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถ Import ได้")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview([])
    setPreviewErrors([])
    setImportResult(null)
    setStep("upload")
  }

  const downloadTemplate = () => {
    const csv = [
      "studentId,firstName,lastName,department,year",
      "68201010001,สมชาย,ใจดี,คอมพิวเตอร์,ปวช.1",
      "67201010002,สมหญิง,รักเรียน,ช่างยนต์,ปวช.2",
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai">นำเข้าข้อมูลนักศึกษาจาก Excel</CardTitle>
            <CardDescription className="font-thai">รองรับไฟล์ .csv และ .xls จากระบบเช็คชื่อ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 font-thai">
                <p className="font-semibold">รูปแบบไฟล์เช็คชื่อ (รองรับอัตโนมัติ):</p>
                <code className="block bg-white/60 p-2 rounded text-xs mt-1 font-mono">
                  เลขที่, รหัสนักศึกษา, ชื่อ, นามสกุล, แผนก, คาบ1, ..., คาบ20
                </code>
                <p className="text-xs mt-2">
                  ✓ ดึงเฉพาะรหัสนักศึกษา, ชื่อ, นามสกุล, แผนก<br />
                  ✓ ชั้นปีคำนวณอัตโนมัติจากรหัสนักศึกษา<br />
                  ✓ รหัสผ่านเริ่มต้น = รหัสนักศึกษา
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-1">
              <Label htmlFor="file" className="font-thai">เลือกไฟล์ CSV / Excel</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <Alert className="bg-gray-50 border-gray-200">
                <FileSpreadsheet className="h-4 w-4 text-gray-500" />
                <AlertDescription className="font-thai text-gray-700">
                  ไฟล์: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="font-thai gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                ดาวน์โหลดไฟล์ตัวอย่าง
              </Button>

              <Button
                onClick={handlePreview}
                disabled={!file || loading}
                className="flex-1 font-thai gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด...</>
                ) : (
                  <><FileSpreadsheet className="h-4 w-4" /> ดูตัวอย่างข้อมูล</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PREVIEW */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai">ตัวอย่างข้อมูล</CardTitle>
            <CardDescription className="font-thai">
              พบนักศึกษา {previewTotal} คน (แสดง {Math.min(preview.length, 10)} คนแรก)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewErrors.length > 0 && (
              <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-thai">
                  พบข้อผิดพลาด {previewErrors.length} รายการ — แถวเหล่านี้จะถูกข้ามเมื่อ Import
                </AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-thai">รหัสนักศึกษา</TableHead>
                    <TableHead className="font-thai">ชื่อ</TableHead>
                    <TableHead className="font-thai">นามสกุล</TableHead>
                    <TableHead className="font-thai">แผนก</TableHead>
                    <TableHead className="font-thai">ชั้นปี</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                      <TableCell className="font-thai text-sm">{s.firstName}</TableCell>
                      <TableCell className="font-thai text-sm">{s.lastName}</TableCell>
                      <TableCell className="font-thai text-sm">{s.department}</TableCell>
                      <TableCell className="font-thai text-sm">{YEAR_DISPLAY[s.year] ?? `ปีที่ ${s.year}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1 font-thai">
                ยกเลิก
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || previewTotal === 0}
                className="flex-1 font-thai gap-2 bg-[#2E3192] hover:bg-[#2E3192]/90"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> กำลัง Import...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Import {previewTotal} คน</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: RESULT */}
      {step === "result" && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai">ผลการ Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                <div className="text-xs text-gray-500 font-thai">ทั้งหมด</div>
                <div className="text-2xl font-bold">{importResult.summary.total}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border text-center">
                <div className="text-xs text-gray-500 font-thai">สำเร็จ</div>
                <div className="text-2xl font-bold text-green-600">{importResult.summary.success}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border text-center">
                <div className="text-xs text-gray-500 font-thai">ล้มเหลว</div>
                <div className="text-2xl font-bold text-red-600">{importResult.summary.failed}</div>
              </div>
            </div>

            {importResult.summary.success > 0 && importResult.summary.failed === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 font-thai">
                  Import นักศึกษาสำเร็จทั้งหมด {importResult.summary.success} คน
                </AlertDescription>
              </Alert>
            )}

            {importResult.errors.length > 0 && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-thai">
                  <p className="font-semibold mb-1">รายการที่ล้มเหลว:</p>
                  <ul className="text-sm space-y-0.5">
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        {(err.data as StudentPreview | undefined)?.studentId
                          ? `รหัส ${(err.data as StudentPreview).studentId}: `
                          : `แถว ${err.row}: `}
                        {err.error}
                      </li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li className="text-gray-500">...และอีก {importResult.errors.length - 5} รายการ</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="font-thai">
                Import ใหม่
              </Button>
              <Button
                onClick={() => { router.push("/admin/students"); router.refresh() }}
                className="font-thai"
              >
                ดูรายชื่อนักศึกษา
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
