"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle, type LucideIcon } from "lucide-react"

interface FileDropzoneProps {
  id: string
  accept: string
  icon: LucideIcon
  file: File | null
  onFileChange: (file: File | null) => void
  title?: string
  subtitle?: string
  disabled?: boolean
}

export function FileDropzone({
  id,
  accept,
  icon: Icon,
  file,
  onFileChange,
  title = "ลากไฟล์มาวางที่นี่",
  subtitle = "หรือคลิกเพื่อเลือกไฟล์",
  disabled,
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return
    onFileChange(e.dataTransfer.files?.[0] ?? null)
  }

  return (
    <div className="space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById(id)?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all select-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${
          dragActive
            ? "border-[#2E3192] bg-blue-50 shadow-md"
            : "border-gray-300 hover:border-[#2E3192] hover:bg-gray-50"
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${dragActive ? "bg-blue-100" : "bg-gray-100"}`}>
            <Icon className={`h-12 w-12 transition-colors ${dragActive ? "text-[#2E3192]" : "text-gray-400"}`} />
          </div>
        </div>
        <p className="font-semibold text-lg mb-1 text-gray-900 font-thai">
          {dragActive ? "วางไฟล์ที่นี่" : title}
        </p>
        <p className="text-sm text-gray-500 font-thai">{subtitle}</p>
        <Input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

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
            onClick={() => onFileChange(null)}
            className="text-green-600 hover:text-red-500 flex-shrink-0 h-7 w-7 p-0"
          >
            ×
          </Button>
        </div>
      )}
    </div>
  )
}
