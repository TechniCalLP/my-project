"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface SerializedCode {
  id: string
  code: string
  isUsed: boolean
}

interface PrintCodesButtonProps {
  codes: SerializedCode[]
  activityTitle: string
}

export function PrintCodesButton({ codes, activityTitle }: PrintCodesButtonProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>รหัสกิจกรรม - ${activityTitle}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2E3192; padding-bottom: 15px; }
          .header h1 { color: #2E3192; margin: 0 0 5px 0; font-size: 24px; }
          .header p { color: #666; margin: 0; font-size: 14px; }
          .codes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
          .code-card { border: 2px dashed #ccc; padding: 15px; text-align: center; background: #f9f9f9; border-radius: 8px; page-break-inside: avoid; }
          .code-card.used { background: #e5e5e5; opacity: 0.6; }
          .code-label { font-size: 12px; color: #666; margin-bottom: 8px; font-weight: bold; }
          .code-value { font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; color: #2E3192; letter-spacing: 2px; margin: 10px 0; }
          .code-status { font-size: 11px; color: #999; margin-top: 8px; }
          .cut-line { border-top: 1px dashed #999; margin: 15px 0 0 0; padding-top: 5px; font-size: 10px; color: #999; text-align: center; }
          @media print { .code-card { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รหัสกิจกรรม</h1>
          <p>${activityTitle}</p>
        </div>
        <div class="codes-grid">
          ${codes
            .map(
              (c) => `
            <div class="code-card${c.isUsed ? " used" : ""}">
              <div class="code-label">รหัสเข้าร่วมกิจกรรม</div>
              <div class="code-value">${c.code}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <Button variant="outline" onClick={handlePrint} className="font-thai gap-2">
      <Printer className="w-4 h-4" />
      พิมพ์รหัส
    </Button>
  )
}
