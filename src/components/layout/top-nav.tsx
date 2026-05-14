"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Home, Calendar, History, Settings, LogOut, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Session } from "next-auth"

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: Home },
  { href: "/activities", label: "กิจกรรม", icon: Calendar },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
]

interface TopNavProps {
  user: Session["user"]
  className?: string
}

export function TopNav({ user, className }: TopNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("bg-white border-b sticky top-0 z-40", className)}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo-college.png"
                  alt="วิทยาลัยเทคนิคลำปาง"
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              </div>
              <span className="font-semibold text-gray-900 hidden lg:block font-thai">
                วิทยาลัยเทคนิคลำปาง
              </span>
            </Link>

            <div className="flex gap-1">
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
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors font-thai",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors outline-none">
                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary-700 font-thai">
                    {user.name?.charAt(0) ?? "น"}
                  </span>
                </div>
                <span className="hidden lg:block max-w-[140px] truncate font-thai">
                  {user.name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold font-thai">{user.name}</p>
                <p className="text-xs text-gray-500 font-thai mt-0.5">
                  {user.year} • {user.department}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer font-thai">
                  <Settings className="w-4 h-4 mr-2" />
                  ตั้งค่าบัญชี
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-thai"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
