"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileDropzone } from "@/components/ui/file-dropzone"

interface SignatureData {
  id: string
  name: string
  position: string
  imageData: string
  isActive: boolean
}

interface SignatureFormDialogProps {
  mode: "create" | "edit"
  signature?: SignatureData
  trigger: React.ReactNode
}

export default function SignatureFormDialog({ mode, signature, trigger }: SignatureFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(signature?.name ?? "")
  const [position, setPosition] = useState(signature?.position ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(signature?.isActive ?? true)
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setName(signature?.name ?? "")
      setPosition(signature?.position ?? "")
      setFile(null)
      setFilePreview(null)
      setIsActive(signature?.isActive ?? true)
    }
  }

  const handleFileChange = (f: File | null) => {
    setFile(f)
    setFilePreview(f ? URL.createObjectURL(f) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("กรุณาระบุชื่อเอกสาร")
      return
    }
    if (!position.trim()) {
      toast.error("กรุณาระบุรายละเอียด")
      return
    }
    if (mode === "create" && !file) {
      toast.error("กรุณาแนบไฟล์ลายเซ็น")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", name.trim())
      formData.append("position", position.trim())
      formData.append("isActive", String(isActive))
      if (file) formData.append("file", file)

      const url = mode === "create" ? "/api/admin/settings/signatures" : `/api/admin/settings/signatures/${signature!.id}`
      const res = await fetch(url, { method: mode === "create" ? "POST" : "PATCH", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }

      toast.success(mode === "create" ? "เพิ่มลายเซ็นสำเร็จ" : "บันทึกการแก้ไขสำเร็จ")
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewSrc = filePreview ?? (mode === "edit" ? signature?.imageData : undefined) ?? null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="font-thai sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-thai">{mode === "create" ? "เพิ่มข้อมูล" : "แก้ไขข้อมูล"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-thai text-xs text-gray-500">ภาพพรีวิวลายเซ็นปัจจุบัน (Current Preview)</Label>
            <div className="border rounded-lg bg-gray-50 h-28 flex items-center justify-center overflow-hidden">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt="ตัวอย่างลายเซ็น" className="max-h-full max-w-full object-contain p-3" />
              ) : (
                <p className="text-xs text-gray-400 font-thai">ยังไม่มีตัวอย่างลายเซ็น</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-thai">ชื่อเอกสาร</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ลายเซ็นรองผู้อำนวยการ" className="font-thai" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-thai">รายละเอียด</Label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="ตำแหน่งผู้อำนวยการวิทยาลัยเทคโนโลยีภาคกลาง"
              className="font-thai"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-thai">อัปโหลด</Label>
            <FileDropzone
              id={`signature-file-${mode}-${signature?.id ?? "new"}`}
              accept="image/png,image/svg+xml"
              icon={Upload}
              file={file}
              onFileChange={handleFileChange}
              title="คลิกเพื่อเลือกไฟล์ หรือ ลากและวางไฟล์ลงที่นี่"
              subtitle="รองรับเฉพาะไฟล์ PNG หรือ SVG ขนาดไม่เกิน 500KB (แนะนำพื้นหลังโปร่งใส)"
            />
          </div>

          <div className="flex items-center justify-between gap-3 border rounded-lg p-3">
            <div>
              <p className="font-thai text-sm font-medium">สถานะการใช้งาน</p>
              <p className="font-thai text-xs text-gray-500">หากเปิดใช้งาน ระบบจะใช้ลายเซ็นนี้ประทับบนเอกสารหลักโดยอัตโนมัติ</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="font-thai" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting} className="font-thai gap-1.5">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "create" ? "เพิ่มข้อมูล" : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
