"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { LayoutDashboard, CalendarDays, Users, LogOut, Menu, UserCog, Building2, Users2, ClipboardCheck, ListChecks, FileEdit, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ADMIN_ROLE_NAMES } from "@/lib/constants"

const PENDING_COUNT_POLL_MS = 60000

interface AdminNavProps {
  session: Session
}

const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/activities", label: "กิจกรรม", icon: CalendarDays },
  { href: "/admin/students", label: "นักศึกษา", icon: Users },
  { href: "/admin/vocational-activities", label: "กิจกรรมองค์การวิชาชีพ", icon: ClipboardCheck },
  { href: "/admin/summary", label: "สรุปผลการประเมิน", icon: ListChecks },
  { href: "/admin/clubs", label: "ชมรมวิชาชีพ", icon: Users2 },
]

const SUPER_ADMIN_NAV_ITEMS = [
  ...ADMIN_NAV_ITEMS,
  { href: "/admin/accounts", label: "บัญชีผู้ใช้", icon: UserCog },
  { href: "/admin/departments", label: "แผนก", icon: Building2 },
  { href: "/admin/correction-requests", label: "คำขอแก้ไขคะแนน", icon: FileEdit },
  { href: "/admin/settings", label: "ตั้งค่าระบบ", icon: Settings },
]

const TEACHER_NAV_ITEMS = [
  { href: "/admin/evaluation", label: "ประเมินกิจกรรมองค์การวิชาชีพ", icon: ClipboardCheck },
  { href: "/admin/my-students", label: "รายชื่อนักศึกษา", icon: Users },
  { href: "/admin/summary", label: "สรุปผลการประเมิน", icon: ListChecks },
]

function getNavItems(adminRole?: string) {
  if (adminRole === "SUPER_ADMIN") return SUPER_ADMIN_NAV_ITEMS
  if (adminRole === "TEACHER") return TEACHER_NAV_ITEMS
  return ADMIN_NAV_ITEMS
}

function NavContent({
  session,
  onNavigate,
  pendingCorrectionCount,
}: {
  session: Session
  onNavigate?: () => void
  pendingCorrectionCount: number
}) {
  const pathname = usePathname()
  const adminRole = (session.user as { adminRole?: string }).adminRole
  const navItems = getNavItems(adminRole)
  const roleLabel = adminRole ? ADMIN_ROLE_NAMES[adminRole as keyof typeof ADMIN_ROLE_NAMES] : "ผู้ดูแลระบบ"

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-6 border-b border-gray-700">
        <p className="text-xs text-gray-400 font-thai">{roleLabel}</p>
        <p className="font-semibold truncate font-thai text-sm mt-0.5">{session.user.name}</p>
      </div>
      <div className="flex-1 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-gray-800 font-thai",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary-500 text-white"
                : "text-gray-300"
            )}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {href === "/admin/correction-requests" && pendingCorrectionCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-orange-500 text-white text-[11px] font-medium">
                {pendingCorrectionCount > 99 ? "99+" : pendingCorrectionCount}
              </span>
            )}
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
    </div>
  )
}

export function AdminNav({ session }: AdminNavProps) {
  const [open, setOpen] = useState(false)
  const [pendingCorrectionCount, setPendingCorrectionCount] = useState(0)
  const adminRole = (session.user as { adminRole?: string }).adminRole

  useEffect(() => {
    if (adminRole !== "SUPER_ADMIN") return

    let cancelled = false
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/admin/correction-requests/pending-count")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setPendingCorrectionCount(data.count ?? 0)
      } catch {
        // ignore — badge just stays at its last known value
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, PENDING_COUNT_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [adminRole])

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex w-64 min-h-screen flex-shrink-0">
        <div className="w-full">
          <NavContent session={session} pendingCorrectionCount={pendingCorrectionCount} />
        </div>
      </nav>

      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-gray-900 text-white flex items-center gap-3 px-4 shadow-md">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-1.5 rounded hover:bg-gray-700 transition-colors" aria-label="เมนู">
              <Menu size={22} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-gray-900 border-gray-700" showCloseButton={false}>
            <NavContent
              session={session}
              onNavigate={() => setOpen(false)}
              pendingCorrectionCount={pendingCorrectionCount}
            />
          </SheetContent>
        </Sheet>
        <span className="font-semibold font-thai text-sm">ระบบจัดการกิจกรรม</span>
      </header>
    </>
  )
}
