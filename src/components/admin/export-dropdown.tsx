"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileOutput, FileSpreadsheet, FileText } from "lucide-react"

interface ExportDropdownProps {
  excelUrl: string
  printUrl: string
}

export default function ExportDropdown({ excelUrl, printUrl }: ExportDropdownProps) {
  const searchParams = useSearchParams()

  const buildUrl = (base: string) => {
    const qs = searchParams.toString()
    return qs ? `${base}?${qs}` : base
  }

  const handleExcel = () => {
    window.location.href = buildUrl(excelUrl)
  }

  const handlePdf = () => {
    window.open(buildUrl(printUrl), "_blank")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-thai gap-2">
          <FileOutput className="w-4 h-4" />
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
