"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, CheckCircle2, XCircle, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
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
  prefix: string
  firstName: string
  lastName: string
  department: string
  year: number
  group: string | null
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
  const [department, setDepartment] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<StudentPreview[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [importResult, setImportResult] = useState<{
    summary: { total: number; success: number; failed: number }
    errors: ImportError[]
  } | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload")
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (selected: File | null) => {
    if (!selected) return
    setFile(selected)
    setPreview([])
    setDepartment("")
    setImportResult(null)
    setStep("upload")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null)
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mode", "preview")
      if (department.trim()) formData.append("department", department.trim())

      const res = await fetch("/api/admin/students/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")
      if (data.total === 0) throw new Error("ไม่พบข้อมูลนักศึกษาในไฟล์")

      setPreview(data.preview || [])
      setPreviewTotal(data.total || 0)

      const detectedDept = data.preview?.[0]?.department || ""
      if (detectedDept && detectedDept !== "ไม่ระบุ") setDepartment(detectedDept)

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
      if (department.trim()) formData.append("department", department.trim())

      const res = await fetch("/api/admin/students/import", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")

      setImportResult(data)
      setStep("result")

      if (data.summary.failed === 0) {
        toast.success(`Import สำเร็จ ${data.summary.success} คน`)
      } else {
        toast.warning(`Import ${data.summary.success} คน สำเร็จ, ล้มเหลว ${data.summary.failed} คน`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถ Import ได้")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setDepartment("")
    setPreview([])
    setImportResult(null)
    setStep("upload")
  }

  return (
    <div className="space-y-6">

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai">นำเข้าข้อมูลนักศึกษา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer select-none ${
                dragActive
                  ? "border-[#2E3192] bg-blue-50 shadow-md"
                  : "border-gray-300 hover:border-[#2E3192] hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${dragActive ? "bg-blue-100" : "bg-gray-100"}`}>
                  <FileSpreadsheet
                    className={`h-12 w-12 transition-colors ${dragActive ? "text-[#2E3192]" : "text-gray-400"}`}
                  />
                </div>
              </div>
              <p className="font-semibold text-lg mb-1 text-gray-900 font-thai">
                {dragActive ? "วางไฟล์ที่นี่" : "ลากไฟล์มาวางที่นี่"}
              </p>
              <p className="text-sm text-gray-500 font-thai">หรือคลิกเพื่อเลือกไฟล์</p>
              <Input
                id="file-input"
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                onClick={e => e.stopPropagation()}
              />
            </div>

            {/* Selected file info */}
            {file && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-900 truncate text-sm">{file.name}</p>
                  <p className="text-xs text-green-700">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-green-600 hover:text-red-500 flex-shrink-0 h-7 w-7 p-0"
                >
                  ×
                </Button>
              </div>
            )}

            <Button
              onClick={handlePreview}
              disabled={!file || loading}
              className="w-full bg-[#2E3192] hover:bg-[#2E3192]/90 h-11 font-thai gap-2"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> กำลังโหลด...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> ดูตัวอย่างข้อมูล</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PREVIEW */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai">ตัวอย่างข้อมูล</CardTitle>
            <CardDescription className="font-thai">
              พบนักศึกษาทั้งหมด <strong>{previewTotal} คน</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Department — editable inline */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-200">
              <span className="text-sm font-thai text-blue-700 flex-shrink-0">แผนก:</span>
              <Input
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="ระบุแผนกวิชา"
                className="h-7 text-sm font-thai border-0 bg-transparent p-0 focus-visible:ring-0 text-blue-900 font-semibold placeholder:font-normal placeholder:text-blue-400"
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-thai">รหัสนักศึกษา</TableHead>
                    <TableHead className="font-thai">ชื่อ-สกุล</TableHead>
                    <TableHead className="font-thai">แผนก</TableHead>
                    <TableHead className="font-thai">ชั้นปี</TableHead>
                    <TableHead className="font-thai">กลุ่ม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                      <TableCell className="font-thai text-sm">{s.prefix}{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="font-thai text-sm">{s.department}</TableCell>
                      <TableCell className="font-thai text-sm">{YEAR_DISPLAY[s.year] ?? `ปีที่ ${s.year}`}</TableCell>
                      <TableCell className="font-mono text-sm">{s.group ?? '-'}</TableCell>
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
                className="flex-1 bg-[#2E3192] hover:bg-[#2E3192]/90 font-thai gap-2"
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 font-thai">ทั้งหมด</div>
                <div className="text-2xl font-bold text-blue-600">{importResult.summary.total}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 font-thai">สำเร็จ</div>
                <div className="text-2xl font-bold text-green-600">{importResult.summary.success}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-600 font-thai">ล้มเหลว</div>
                <div className="text-2xl font-bold text-red-600">{importResult.summary.failed}</div>
              </div>
            </div>

            {importResult.summary.failed === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 font-thai">
                  Import นักศึกษาสำเร็จทั้งหมด {importResult.summary.success} คน
                </AlertDescription>
              </Alert>
            )}

            {importResult.errors.length > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-thai">
                  <p className="font-semibold mb-1">รายการที่ล้มเหลว:</p>
                  <ul className="text-sm space-y-0.5 max-h-40 overflow-y-auto">
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
              <Button variant="outline" onClick={handleReset} className="flex-1 font-thai">
                Import ใหม่
              </Button>
              <Button
                onClick={() => { router.push("/admin/students"); router.refresh() }}
                className="flex-1 bg-[#2E3192] hover:bg-[#2E3192]/90 font-thai"
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
