"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const ALL_VALUE = "__all__"

export default function SignatureFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const currentStatus = searchParams.get("status") ?? ""

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`/admin/settings?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchTerm)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="ค้นหาชื่อผู้บริหาร หรือตำแหน่ง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 font-thai"
          />
        </div>
        <Button type="submit" size="sm" className="gap-1.5 font-thai shrink-0">
          <Search className="w-3.5 h-3.5" />
          ค้นหา
        </Button>
      </form>

      <Select value={currentStatus || ALL_VALUE} onValueChange={(v) => updateFilter("status", v)}>
        <SelectTrigger className="w-44 font-thai">
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE} className="font-thai">สถานะ: ทั้งหมด</SelectItem>
          <SelectItem value="active" className="font-thai">กำลังใช้งานหลัก</SelectItem>
          <SelectItem value="inactive" className="font-thai">ปิดการใช้งาน</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
