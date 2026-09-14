"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/ui/file-dropzone"

interface SignatureUploadProps {
  initialSignature: string | null
}

export default function SignatureUpload({ initialSignature }: SignatureUploadProps) {
  const router = useRouter()
  const [signature, setSignature] = useState(initialSignature)
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
      const res = await fetch("/api/admin/settings/signature", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }
      const data = await res.json()
      setSignature(data.signature)
      setPreview(null)
      setFile(null)
      toast.success("บันทึกลายเซ็นเรียบร้อยแล้ว")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm("ต้องการลบลายเซ็นที่บันทึกไว้หรือไม่?")) return
    setRemoving(true)
    try {
      const res = await fetch("/api/admin/settings/signature", { method: "DELETE" })
      if (!res.ok) throw new Error("ลบไม่สำเร็จ")
      setSignature(null)
      toast.success("ลบลายเซ็นแล้ว")
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
        <Label className="font-thai">ลายเซ็นรองผู้อำนวยการ</Label>
        <p className="text-xs text-gray-500 font-thai">
          รูปลายเซ็นนี้จะถูกใส่อัตโนมัติในใบ Export PDF (อวท.15 / อวท.17) ทุกใบ แทนช่องลงชื่อว่าง
        </p>
      </div>

      {signature && !file && (
        <div className="flex items-center justify-between gap-3 border rounded-md p-4 bg-gray-50">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signature} alt="ลายเซ็น" className="h-16 object-contain" />
            <p className="text-sm text-gray-500 font-thai">ลายเซ็นปัจจุบัน</p>
          </div>
          <Button onClick={handleRemove} disabled={removing} size="sm" variant="outline" className="font-thai gap-1.5 text-secondary-600">
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            ลบลายเซ็น
          </Button>
        </div>
      )}

      <FileDropzone
        id="signature-input"
        accept="image/*"
        icon={ImageIcon}
        file={file}
        onFileChange={handleFileChange}
        title="ลากไฟล์รูปลายเซ็นมาวางที่นี่"
        subtitle="หรือคลิกเพื่อเลือกไฟล์ (JPG, PNG ไม่เกิน 2MB)"
      />

      {preview && (
        <div className="border rounded-md p-4 w-fit bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="ตัวอย่างลายเซ็นใหม่" className="h-16 object-contain" />
        </div>
      )}

      {file && (
        <Button onClick={handleUpload} disabled={uploading} size="sm" className="font-thai gap-1.5">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          บันทึกลายเซ็น
        </Button>
      )}
    </div>
  )
}
