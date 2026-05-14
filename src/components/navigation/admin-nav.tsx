"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { LayoutDashboard, CalendarDays, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminNavProps {
  session: Session
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/activities", label: "กิจกรรม", icon: CalendarDays },
  { href: "/admin/students", label: "นักศึกษา", icon: Users },
]

export function AdminNav({ session }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <p className="text-sm text-gray-400 font-thai">ผู้ดูแลระบบ</p>
        <p className="font-semibold truncate font-thai">{session.user.name}</p>
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
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-2 py-2 text-sm text-gray-300 hover:text-white transition-colors w-full font-thai"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </nav>
  )
}
