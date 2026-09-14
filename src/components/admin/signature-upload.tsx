"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
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

  const displayed = preview ?? signature

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="font-thai">ลายเซ็นรองผู้อำนวยการ</Label>
        <p className="text-xs text-gray-500 font-thai">
          รูปลายเซ็นนี้จะถูกใส่อัตโนมัติในใบ Export PDF (อวท.15 / อวท.17) ทุกใบ แทนช่องลงชื่อว่าง
        </p>
      </div>

      {displayed && (
        <div className="border rounded-md p-4 w-fit bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayed} alt="ลายเซ็น" className="h-16 object-contain" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="text-sm font-thai"
        />
        {file && (
          <Button onClick={handleUpload} disabled={uploading} size="sm" className="font-thai gap-1.5">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            บันทึกลายเซ็น
          </Button>
        )}
        {signature && !file && (
          <Button onClick={handleRemove} disabled={removing} size="sm" variant="outline" className="font-thai gap-1.5 text-secondary-600">
            {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            ลบลายเซ็น
          </Button>
        )}
      </div>
    </div>
  )
}
