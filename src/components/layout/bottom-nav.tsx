"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, History, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: Home },
  { href: "/activities", label: "กิจกรรม", icon: Calendar },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
]

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 bg-white border-t z-50", className)}>
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary-500" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium font-thai">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
