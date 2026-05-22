"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileOutput, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

interface ExportDropdownProps {
  excelUrl: string
  printUrl: string
}

export default function ExportDropdown({ excelUrl, printUrl }: ExportDropdownProps) {
  const searchParams = useSearchParams()
  const [downloading, setDownloading] = useState(false)

  const buildUrl = (base: string) => {
    const qs = searchParams.toString()
    return qs ? `${base}?${qs}` : base
  }

  const handleExcel = async () => {
    setDownloading(true)
    try {
      const res = await fetch(buildUrl(excelUrl))
      if (!res.ok) throw new Error("Download failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
      link.download = match ? decodeURIComponent(match[1]) : "export.xlsx"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("ดาวน์โหลด Excel สำเร็จ")
    } catch {
      toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่")
    } finally {
      setDownloading(false)
    }
  }

  const handlePdf = () => {
    window.open(buildUrl(printUrl), "_blank")
    toast.success("เปิดหน้า PDF แล้ว")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-thai gap-2" disabled={downloading}>
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileOutput className="w-4 h-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-thai">
        <DropdownMenuItem onClick={handleExcel} className="gap-2 cursor-pointer" disabled={downloading}>
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Export Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-500" />
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
