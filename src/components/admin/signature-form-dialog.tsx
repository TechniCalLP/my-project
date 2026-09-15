"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileDropzone } from "@/components/ui/file-dropzone"

interface SignatureData {
  id: string
  name: string
  position: string
  imageData: string
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
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setName(signature?.name ?? "")
      setPosition(signature?.position ?? "")
      setFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("กรุณาระบุชื่อผู้ลงนาม")
      return
    }
    if (!position.trim()) {
      toast.error("กรุณาระบุตำแหน่ง")
      return
    }
    if (mode === "create" && !file) {
      toast.error("กรุณาแนบไฟล์รูปลายเซ็น")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", name.trim())
      formData.append("position", position.trim())
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="font-thai">
        <DialogHeader>
          <DialogTitle className="font-thai">{mode === "create" ? "เพิ่มลายเซ็นใหม่" : "แก้ไขข้อมูลลายเซ็น"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-thai">ชื่อผู้ลงนาม</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น นายณัฐวุฒิ ตั้งมั่น" className="font-thai" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-thai">ตำแหน่ง</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="เช่น รองผู้อำนวยการฝ่ายวิชาการ" className="font-thai" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-thai">
              รูปลายเซ็น{mode === "edit" && <span className="text-gray-400 font-normal"> (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
            </Label>
            {mode === "edit" && signature && !file && (
              <div className="border rounded-md p-3 bg-gray-50 w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signature.imageData} alt="ลายเซ็นปัจจุบัน" className="h-12 object-contain" />
              </div>
            )}
            <FileDropzone
              id={`signature-file-${mode}-${signature?.id ?? "new"}`}
              accept="image/*"
              icon={ImageIcon}
              file={file}
              onFileChange={setFile}
              title="ลากไฟล์รูปลายเซ็นมาวางที่นี่"
              subtitle="หรือคลิกเพื่อเลือกไฟล์ (JPG, PNG ไม่เกิน 2MB)"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="font-thai" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting} className="font-thai gap-1.5">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
