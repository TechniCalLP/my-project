'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminNav } from "@/components/navigation/admin-nav"
import type { Session } from "next-auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/admin/login")
      return
    }

    if (session.user?.role !== "admin") {
      console.warn("Unauthorized access attempt to admin panel")
      router.push("/dashboard")
      return
    }

    setIsAuthorized(true)
  }, [session, status, router])

  if (!isAuthorized || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:flex min-h-screen">
      <AdminNav session={session as Session} />
      <main className="flex-1 bg-gray-50 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
