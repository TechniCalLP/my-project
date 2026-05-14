import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/navigation/admin-nav"
import type { Session } from "next-auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav session={session as Session} />
      <main className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </main>
    </div>
  )
}
