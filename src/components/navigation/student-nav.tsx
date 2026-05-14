"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { LayoutDashboard, CalendarDays, QrCode, History, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentNavProps {
  session: Session
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activities", label: "กิจกรรม", icon: CalendarDays },
  { href: "/join", label: "เข้าร่วม", icon: QrCode },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
]

export function StudentNav({ session }: StudentNavProps) {
  const pathname = usePathname()

  return (
    <nav className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <p className="text-sm text-gray-400 font-thai">นักศึกษา</p>
        <p className="font-semibold truncate font-thai">{session.user.name}</p>
        <p className="text-xs text-gray-400">{session.user.year} • {session.user.department}</p>
      </div>
      <div className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-gray-800 font-thai",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary-500 text-white"
                : "text-gray-300"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-2 py-2 text-sm text-gray-300 hover:text-white transition-colors w-full font-thai"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </nav>
  )
}
