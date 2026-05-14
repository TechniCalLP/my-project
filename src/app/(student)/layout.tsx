import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TopNav } from "@/components/layout/top-nav"
import { BottomNav } from "@/components/layout/bottom-nav"
import { MobileHeader } from "@/components/layout/mobile-header"
import type { Session } from "next-auth"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader className="md:hidden" user={session.user as Session["user"]} />
      <TopNav className="hidden md:block" user={session.user as Session["user"]} />

      <main className="pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>

      <BottomNav className="md:hidden" />
    </div>
  )
}
