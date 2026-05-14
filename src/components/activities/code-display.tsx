"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Copy, Check } from "lucide-react"

interface ActivityCode {
  id: string
  code: string
  isUsed: boolean
  usedAt?: Date | string | null
  usedBy?: string | null
  createdAt: Date | string
}

interface CodeDisplayProps {
  codes: ActivityCode[]
}

export function CodeDisplay({ codes }: CodeDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success(`คัดลอกรหัส ${code} แล้ว`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyAll = async () => {
    const unused = codes.filter((c) => !c.isUsed).map((c) => c.code)
    if (unused.length === 0) {
      toast.error("ไม่มีรหัสที่ยังไม่ได้ใช้")
      return
    }
    await navigator.clipboard.writeText(unused.join("\n"))
    toast.success(`คัดลอก ${unused.length} รหัสแล้ว`)
  }

  if (codes.length === 0) {
    return <p className="text-center text-gray-500 py-8 font-thai">ยังไม่มีรหัสกิจกรรม</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 font-thai">
          ทั้งหมด {codes.length} รหัส | ใช้แล้ว {codes.filter((c) => c.isUsed).length} | ยังไม่ใช้ {codes.filter((c) => !c.isUsed).length}
        </p>
        <Button variant="outline" size="sm" onClick={copyAll} className="font-thai">
          <Copy size={14} className="mr-1" />
          คัดลอกทั้งหมด (ที่ยังไม่ใช้)
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-thai">รหัส</TableHead>
            <TableHead className="font-thai">สถานะ</TableHead>
            <TableHead className="font-thai">ใช้เมื่อ</TableHead>
            <TableHead className="font-thai">สร้างเมื่อ</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <TableRow key={code.id}>
              <TableCell className="font-mono font-bold text-lg tracking-widest">{code.code}</TableCell>
              <TableCell>
                {code.isUsed ? (
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-thai">ใช้แล้ว</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 border border-green-200 font-thai">ยังไม่ใช้</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500 font-thai">
                {code.usedAt ? new Date(code.usedAt).toLocaleDateString("th-TH") : "-"}
              </TableCell>
              <TableCell className="text-sm text-gray-500 font-thai">
                {new Date(code.createdAt).toLocaleDateString("th-TH")}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(code.id, code.code)}
                  disabled={code.isUsed}
                >
                  {copiedId === code.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
