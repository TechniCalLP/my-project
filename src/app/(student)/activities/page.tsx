import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SemesterTabs } from "@/components/activities/semester-tabs"

function getCurrentSemesterTab(): string {
  return "ภาคเรียนที่ 1"
}

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") redirect("/login")

  const studentYear = session.user.year ?? ""
  const studentDept = session.user.department ?? ""
  const studentDbId = session.user.id

  const activities = await prisma.activity.findMany({
    where: {
      isDeleted: false,
      targetYear: studentYear,
      OR: [
        { targetDepartments: { isEmpty: true } },
        { targetDepartments: { has: studentDept } },
      ],
    },
    include: {
      _count: { select: { participations: true } },
      participations: { where: { studentId: studentDbId } },
    },
    orderBy: { startDate: "asc" },
  })

  const withJoined = activities.map((a) => ({
    ...a,
    isJoined: a.participations.length > 0,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate.toISOString(),
  }))

  const sem1 = withJoined.filter((a) => a.targetSemester === "ภาคเรียนที่ 1")
  const sem2 = withJoined.filter((a) => a.targetSemester === "ภาคเรียนที่ 2")

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-thai">กิจกรรมสำหรับ {studentYear}</h1>
          <p className="text-sm text-gray-500 font-thai">
            กิจกรรมทั้งหมด {activities.length} รายการ
          </p>
        </div>
        <a
          href="/join"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium font-thai hover:bg-primary-600 transition-colors"
        >
          เข้าร่วมด้วยโค้ด
        </a>
      </div>

      <SemesterTabs
        sem1={sem1}
        sem2={sem2}
        defaultSemester={getCurrentSemesterTab()}
        cols={3}
      />
    </div>
  )
}
