"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileOutput, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"

interface SummaryExportButtonsProps {
  year: string
  academicYear: string
  semester: string
  className?: string
}

export default function SummaryExportButtons({ year, academicYear, semester, className }: SummaryExportButtonsProps) {
  const exportParams = new URLSearchParams({ year, academicYear, semester })
  const excelUrl = `/api/admin/summary/export?${exportParams.toString()}`
  const printUrl = `/admin/summary/print?${exportParams.toString()}`

  const handleExcel = async () => {
    try {
      const res = await fetch(excelUrl)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
      link.download = match ? decodeURIComponent(match[1]) : "summary.xlsx"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("ดาวน์โหลด Excel สำเร็จ")
    } catch {
      toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่")
    }
  }

  const handlePdf = () => {
    window.open(printUrl, "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`font-thai gap-1.5 shrink-0 ${className ?? ""}`}>
          <FileOutput className="w-3.5 h-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-thai">
        <DropdownMenuItem onClick={handleExcel} className="gap-2 cursor-pointer">
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
