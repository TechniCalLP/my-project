"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ALL_VALUE = "__all__"

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
  const currentClub = searchParams.get("club") ?? ""

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL_VALUE) params.set("club", value)
    else params.delete("club")
    router.push(`/admin/summary?${params.toString()}`)
  }

  return (
    <Select value={currentClub || ALL_VALUE} onValueChange={handleChange}>
      <SelectTrigger className="w-56 font-thai">
        <SelectValue placeholder="ทุกชมรม" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE} className="font-thai">ทุกชมรม (ทั้งวิทยาลัย)</SelectItem>
        {clubs.map((c) => (
          <SelectItem key={c.id} value={c.id} className="font-thai">{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
