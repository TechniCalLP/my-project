"use client"

import Link from "next/link"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { LogOut, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Session } from "next-auth"

interface MobileHeaderProps {
  user: Session["user"]
  className?: string
}

export function MobileHeader({ user, className }: MobileHeaderProps) {
  return (
    <header className={`bg-white border-b sticky top-0 z-40 ${className ?? ""}`}>
      <div className="flex items-center justify-between h-14 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              src="/logo-college.png"
              alt="วิทยาลัยเทคนิคลำปาง"
              width={32}
              height={32}
              className="rounded-lg object-cover"
            />
          </div>
          <span className="font-semibold text-gray-900 text-sm font-thai">วิทยาลัยเทคนิคลำปาง</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center outline-none">
              <span className="text-sm font-bold text-primary-700 font-thai">
                {user.name?.charAt(0) ?? "น"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
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
    </header>
  )
}
