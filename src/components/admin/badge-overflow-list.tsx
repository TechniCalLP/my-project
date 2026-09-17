"use client"

import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface BadgeOverflowListProps {
  items: string[]
  maxVisible?: number
}

export function BadgeOverflowList({ items, maxVisible = 2 }: BadgeOverflowListProps) {
  const visible = items.slice(0, maxVisible)
  const remaining = items.slice(maxVisible)

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-xs">
      {visible.map((name) => (
        <Badge key={name} variant="outline" className="font-thai text-xs whitespace-nowrap">
          {name}
        </Badge>
      ))}
      {remaining.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">
              <Badge
                variant="outline"
                className="font-thai text-xs whitespace-nowrap text-primary-600 border-primary-200 hover:bg-primary-50 cursor-pointer"
              >
                +{remaining.length}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <div className="flex flex-col gap-1.5">
              {remaining.map((name) => (
                <span key={name} className="text-xs font-thai text-gray-700">
                  {name}
                </span>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
