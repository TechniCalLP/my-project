"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface Club {
  id: string
  name: string
}

interface SummaryClubFilterProps {
  clubs: Club[]
}

export default function SummaryClubFilter({ clubs }: SummaryClubFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentClubId = searchParams.get("club") ?? ""
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedClub = clubs.find((c) => c.id === currentClubId)

  const filteredClubs = useMemo(
    () => clubs.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase())),
    [clubs, search]
  )

  const handleSelect = (clubId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (clubId) params.set("club", clubId)
    else params.delete("club")
    router.push(`/admin/summary?${params.toString()}`)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setSearch("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          role="combobox"
          aria-expanded={open}
          className="w-56 justify-between font-thai font-normal"
        >
          <span className="truncate">{selectedClub ? selectedClub.name : "ทุกชมรม (ทั้งวิทยาลัย)"}</span>
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="ค้นหาชมรม"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 font-thai"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => handleSelect("")}
            className={cn(
              "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-thai text-left hover:bg-gray-100",
              !currentClubId && "bg-gray-100"
            )}
          >
            <Check className={cn("w-3.5 h-3.5 shrink-0", !currentClubId ? "opacity-100" : "opacity-0")} />
            ทุกชมรม (ทั้งวิทยาลัย)
          </button>
          {filteredClubs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c.id)}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-thai text-left hover:bg-gray-100",
                currentClubId === c.id && "bg-gray-100"
              )}
            >
              <Check className={cn("w-3.5 h-3.5 shrink-0", currentClubId === c.id ? "opacity-100" : "opacity-0")} />
              {c.name}
            </button>
          ))}
          {filteredClubs.length === 0 && (
            <p className="text-center text-xs text-gray-400 font-thai py-4">ไม่พบชมรม</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
