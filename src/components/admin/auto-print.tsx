"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="print:hidden flex justify-center gap-3 py-4 bg-white border-b shadow-sm sticky top-0 z-10">
      <Button onClick={() => window.print()} className="gap-2">
        <Printer className="w-4 h-4" />
        พิมพ์ / บันทึก PDF
      </Button>
      <Button variant="outline" onClick={() => window.close()}>
        ปิด
      </Button>
    </div>
  )
}
