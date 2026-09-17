'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminNav } from "@/components/navigation/admin-nav"
import { AdminLoadingSkeleton } from "@/components/layout/loading-skeleton"
import AdminFirstLoginModal from "@/components/admin/first-login-modal"
import type { Session } from "next-auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAuthorized = status === "authenticated" && session?.user?.role === "admin"

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/admin/login")
      return
    }

    if (session.user?.role !== "admin") {
      console.warn("Unauthorized access attempt to admin panel")
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (!isAuthorized || !session) {
    return <AdminLoadingSkeleton />
  }

  return (
    <div className="lg:flex min-h-screen">
      <AdminFirstLoginModal />
      <AdminNav session={session as Session} />
      <main className="flex-1 bg-gray-50 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
