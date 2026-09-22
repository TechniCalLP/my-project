"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { FileOutput, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"

interface SummaryExportButtonsProps {
  year: string
  academicYear: string
  semester: string
  clubId?: string
  className?: string
}

export default function SummaryExportButtons({ year, academicYear, semester, clubId, className }: SummaryExportButtonsProps) {
  const exportParams = new URLSearchParams({ year, academicYear, semester, ...(clubId ? { club: clubId } : {}) })

  const handleExcel = async (formType: "15" | "17") => {
    try {
      const url = `/api/admin/summary/export?${exportParams.toString()}&formType=${formType}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^;"]+)"?/i)
      link.download = match ? decodeURIComponent(match[1]) : "summary.xlsx"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      toast.success("ดาวน์โหลด Excel สำเร็จ")
    } catch {
      toast.error("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่")
    }
  }

  const handlePdf = (formType: "15" | "17") => {
    window.open(`/admin/summary/print?${exportParams.toString()}&formType=${formType}`, "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`font-thai gap-1.5 shrink-0 ${className ?? ""}`}>
          <FileOutput className="w-3.5 h-3.5" />
          ส่งออก
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-thai">
        <DropdownMenuLabel className="flex items-center gap-2 text-green-600">
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExcel("15")} className="cursor-pointer pl-8">
          อวท.15
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExcel("17")} className="cursor-pointer pl-8">
          อวท.17
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-red-500">
          <FileText className="w-4 h-4" />
          PDF
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handlePdf("15")} className="cursor-pointer pl-8">
          อวท.15
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePdf("17")} className="cursor-pointer pl-8">
          อวท.17
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
