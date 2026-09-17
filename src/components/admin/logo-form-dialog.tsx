"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileDropzone } from "@/components/ui/file-dropzone"

interface LogoFormDialogProps {
  currentLogo: string | null
  trigger: React.ReactNode
}

export default function LogoFormDialog({ currentLogo, trigger }: LogoFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setFile(null)
      setPreview(null)
    }
  }

  const handleFileChange = (f: File | null) => {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("กรุณาแนบไฟล์โลโก้")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/settings/logo", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "เกิดข้อผิดพลาด")
      }

      toast.success("บันทึกโลโก้เรียบร้อยแล้ว")
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewSrc = preview ?? currentLogo

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="font-thai sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-thai">แก้ไขโลโก้วิทยาลัย</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 font-thai">ภาพพรีวิวปัจจุบัน (Current Preview)</p>
              <div className="border rounded-lg bg-gray-50 h-28 flex items-center justify-center overflow-hidden">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="โลโก้วิทยาลัย" className="max-h-full max-w-full object-contain p-3" />
                ) : (
                  <p className="text-xs text-gray-400 font-thai">ใช้โลโก้เริ่มต้นของระบบ</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium font-thai">อัปโหลด</p>
              <FileDropzone
                id="logo-file-edit"
                accept="image/png,image/jpeg,image/svg+xml"
                icon={ImageIcon}
                file={file}
                onFileChange={handleFileChange}
                title="คลิกเพื่อเลือกไฟล์ หรือ ลากและวางไฟล์ลงที่นี่"
                subtitle="รองรับเฉพาะไฟล์ PNG, JPG หรือ SVG ไม่เกิน 500KB (แนะนำให้บีบอัดไฟล์ก่อนอัปโหลด)"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" className="font-thai" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting} className="font-thai gap-1.5">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
