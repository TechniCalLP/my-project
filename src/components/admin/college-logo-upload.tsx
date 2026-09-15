"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"

interface CollegeLogoUploadProps {
  initialLogo: string | null
}

export default function CollegeLogoUpload({ initialLogo }: CollegeLogoUploadProps) {
  const router = useRouter()
  const [logo, setLogo] = useState(initialLogo)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleFileChange = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/settings/logo", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      const data = await res.json()
      setLogo(data.logo)
      setPreview(null)
      setFile(null)
      toast.success("บันทึกโลโก้เรียบร้อยแล้ว")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm("ต้องการลบโลโก้ที่ตั้งไว้หรือไม่? ระบบจะกลับไปใช้โลโก้เริ่มต้น")) return
    setRemoving(true)
    try {
      const res = await fetch("/api/admin/settings/logo", { method: "DELETE" })
      if (!res.ok) throw new Error("ลบไม่สำเร็จ")
      setLogo(null)
      toast.success("ลบโลโก้แล้ว")
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm text-gray-500 font-thai">
          โลโก้นี้จะถูกใช้แทนโลโก้เริ่มต้นทั่วทั้งระบบ ทั้งหน้าเข้าสู่ระบบ เมนูของนักศึกษา
          ใบประกาศนียบัตร และเอกสาร Export PDF ทุกจุด
        </p>
      </div>

      {logo && !file && (
        <div className="flex items-center justify-between gap-3 border rounded-md p-4 bg-gray-50">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="โลโก้วิทยาลัย" className="h-16 object-contain" />
            <p className="text-sm text-gray-500 font-thai">โลโก้ที่ใช้งานอยู่</p>
          </div>
          <Button onClick={handleRemove} disabled={removing} size="sm" variant="outline" className="font-thai gap-1.5 text-secondary-600">
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            ลบโลโก้
          </Button>
        </div>
      )}

      <FileDropzone
        id="college-logo-input"
        accept="image/png,image/jpeg,image/svg+xml"
        icon={ImageIcon}
        file={file}
        onFileChange={handleFileChange}
        title="ลากไฟล์โลโก้มาวางที่นี่"
        subtitle="หรือคลิกเพื่อเลือกไฟล์ (PNG, JPG, SVG ไม่เกิน 2MB)"
      />

      {preview && (
        <div className="border rounded-md p-4 w-fit bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="ตัวอย่างโลโก้ใหม่" className="h-16 object-contain" />
        </div>
      )}

      {file && (
        <Button onClick={handleUpload} disabled={uploading} size="sm" className="font-thai gap-1.5">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          บันทึกโลโก้
        </Button>
      )}
    </div>
  )
}
