import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { HistorySemesterTabs } from "@/components/activities/history-semester-tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

function getCurrentSemesterTab(): string {
  const month = new Date().getMonth() + 1
  return month >= 6 && month <= 10 ? "ภาคเรียนที่ 1" : "ภาคเรียนที่ 2"
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") redirect("/login")

  const studentDbId = session.user.id

  const participations = await prisma.participation.findMany({
    where: { studentId: studentDbId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          category: true,
          targetYear: true,
          targetSemester: true,
          location: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  const data = participations.map((p) => ({
    id: p.id,
    joinedAt: p.joinedAt.toISOString(),
    codeUsed: p.codeUsed,
    activity: p.activity,
  }))

  const sem1 = data.filter((p) => p.activity.targetSemester === "ภาคเรียนที่ 1")
  const sem2 = data.filter((p) => p.activity.targetSemester === "ภาคเรียนที่ 2")

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-thai">ประวัติการเข้าร่วมกิจกรรม</h1>
          <p className="text-sm text-gray-500 font-thai">รวม {participations.length} กิจกรรม</p>
        </div>
        {participations.length > 0 && (
          <Link href="/certificate" target="_blank">
            <Button variant="outline" className="font-thai gap-2">
              <FileText className="w-4 h-4" />
              ใบรับรองกิจกรรม
            </Button>
          </Link>
        )}
      </div>

      {participations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-thai font-medium text-gray-600">ยังไม่มีประวัติการเข้าร่วมกิจกรรม</p>
          <p className="text-sm font-thai mt-1">เข้าร่วมกิจกรรมด้วยรหัสที่ได้รับจากครู</p>
        </div>
      ) : (
        <HistorySemesterTabs
          sem1={sem1}
          sem2={sem2}
          defaultSemester={getCurrentSemesterTab()}
        />
      )}
    </div>
  )
}
