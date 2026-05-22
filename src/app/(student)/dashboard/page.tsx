import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ActivityCategory, ActivityStatus } from "@/generated/prisma"
import { CheckCircle2, Calendar, TrendingUp, ArrowRight, CheckCircle } from "lucide-react"
import { SemesterTabs } from "@/components/activities/semester-tabs"

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  ACADEMIC: "📚",
  COMMUNITY_SERVICE: "✨",
  HEALTH: "💪",
  SCOUT: "⛺",
}

function getCurrentSemesterTab(): string {
  const month = new Date().getMonth() + 1
  return month >= 6 && month <= 10 ? "ภาคเรียนที่ 1" : "ภาคเรียนที่ 2"
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") redirect("/login")

  const studentDbId = session.user.id
  const studentYear = session.user.year ?? ""
  const studentDept = session.user.department ?? ""

  const activeYearFilter = {
    isDeleted: false,
    targetYear: studentYear,
    status: ActivityStatus.ACTIVE,
    OR: [
      { targetDepartments: { isEmpty: true } },
      { targetDepartments: { has: studentDept } },
    ],
  }

  const [participationCount, totalForYear, upcomingActivities, recentHistory] = await Promise.all([
    prisma.participation.count({ where: { studentId: studentDbId } }),
    prisma.activity.count({ where: activeYearFilter }),
    prisma.activity.findMany({
      where: {
        isDeleted: false,
        targetYear: studentYear,
        OR: [
          { targetDepartments: { isEmpty: true } },
          { targetDepartments: { has: studentDept } },
        ],
        NOT: { participations: { some: { studentId: studentDbId } } },
      },
      include: { _count: { select: { participations: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.participation.findMany({
      where: { studentId: studentDbId },
      include: { activity: true },
      orderBy: { joinedAt: "desc" },
      take: 3,
    }),
  ])

  const remaining = Math.max(0, totalForYear - participationCount)
  const progress = totalForYear > 0 ? Math.round((participationCount / totalForYear) * 100) : 0

  const withJoined = upcomingActivities.map((a) => ({
    ...a,
    isJoined: false,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate.toISOString(),
  }))
  const upcomingSem1 = withJoined.filter((a) => a.targetSemester === "ภาคเรียนที่ 1")
  const upcomingSem2 = withJoined.filter((a) => a.targetSemester === "ภาคเรียนที่ 2")

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-thai">
          สวัสดี, {session.user.name} 👋
        </h1>
        <p className="text-gray-500 font-thai mt-1">
          {session.user.year} • {session.user.department}
        </p>
      </div>

      {/* Progress Hero */}
      <Card className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-0">
        <CardContent className="p-6 md:p-8 space-y-4">
          <h3 className="text-lg md:text-xl font-semibold font-thai">
            คุณเข้าร่วมแล้ว {participationCount} จาก {totalForYear} กิจกรรม ({progress}%)
          </h3>
          <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-primary-100 font-thai">
            {remaining > 0
              ? `💪 ทำต่อเถอะ! ยังขาดอีก ${remaining} กิจกรรม`
              : `🎉 เยี่ยมมาก! คุณเข้าร่วมครบทุกกิจกรรมแล้ว`}
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{participationCount}</p>
              <p className="text-xs md:text-sm text-gray-600 font-thai">เข้าร่วมกิจกรรม</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{remaining}</p>
              <p className="text-xs md:text-sm text-gray-600 font-thai">คงเหลือกิจกรรม</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{progress}%</p>
              <p className="text-xs md:text-sm text-gray-600 font-thai">ความคืบหน้า</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Activities */}
      {upcomingActivities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 font-thai">กิจกรรมที่ยังไม่ได้เข้าร่วม</h2>
              <p className="text-sm text-gray-500 font-thai">{upcomingActivities.length} กิจกรรม</p>
            </div>
            <Link
              href="/activities"
              className="text-sm text-primary-500 hover:underline font-thai flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>
          <SemesterTabs
            sem1={upcomingSem1}
            sem2={upcomingSem2}
            defaultSemester={getCurrentSemesterTab()}
            variant="compact"
            cols={2}
          />
        </div>
      )}

      {/* Recent History */}
      {recentHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 font-thai">กิจกรรมที่เข้าร่วมล่าสุด</h2>
            <Link
              href="/history"
              className="text-sm text-primary-500 hover:underline font-thai flex items-center gap-1"
            >
              ดูประวัติ <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentHistory.map((p) => (
              <Card key={p.id} className="border-l-4 border-l-success">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-base shrink-0">
                      {p.activity ? CATEGORY_ICONS[p.activity.category] : "🗑️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium font-thai text-sm truncate">{p.activity?.name ?? "[กิจกรรมที่ถูกลบ]"}</p>
                      <p className="text-xs text-gray-400 font-thai">
                        {new Date(p.joinedAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {upcomingActivities.length === 0 && recentHistory.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-gray-700 font-thai">ยังไม่มีกิจกรรม</p>
            <p className="text-sm text-gray-400 font-thai mt-1">ขณะนี้ยังไม่มีกิจกรรมสำหรับคุณ</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
