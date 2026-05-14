import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ActivityStatus } from "@/generated/prisma"
import StatsCards from "@/components/admin/stats-cards"
import RecentActivities from "@/components/admin/recent-activities"

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const [totalActivities, activeActivities, totalStudents, totalParticipations, recentActivities] =
    await Promise.all([
      prisma.activity.count(),
      prisma.activity.count({ where: { status: ActivityStatus.ACTIVE } }),
      prisma.student.count(),
      prisma.participation.count(),
      prisma.activity.findMany({
        include: { _count: { select: { participations: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

  const stats = [
    { label: "กิจกรรมทั้งหมด", value: totalActivities, icon: "calendar" as const },
    { label: "กิจกรรมที่เปิดรับ", value: activeActivities, icon: "calendar" as const, valueClass: "text-primary-500" },
    { label: "นักศึกษาทั้งหมด", value: totalStudents, icon: "users" as const },
    { label: "การเข้าร่วมทั้งหมด", value: totalParticipations, icon: "clipboard" as const },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-thai">แดชบอร์ดผู้ดูแลระบบ</h1>
        <Link href="/admin/activities/new">
          <Button className="font-thai">+ สร้างกิจกรรม</Button>
        </Link>
      </div>

      <StatsCards stats={stats} />

      <RecentActivities activities={recentActivities} />
    </div>
  )
}
