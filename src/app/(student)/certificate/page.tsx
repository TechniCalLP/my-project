import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CATEGORY_NAMES } from "@/lib/constants"
import CertificatePrint from "@/components/student/certificate-print"

export default async function CertificatePage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id: session.user.id },
    select: {
      studentId: true,
      prefix: true,
      firstName: true,
      lastName: true,
      department: true,
      year: true,
      participations: {
        include: {
          activity: {
            select: {
              name: true,
              category: true,
              targetYear: true,
              targetSemester: true,
              startDate: true,
              location: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  })

  if (!student) redirect("/login")

  const activities = student.participations.map((p) => ({
    name: p.activity.name,
    category: CATEGORY_NAMES[p.activity.category],
    targetYear: p.activity.targetYear,
    targetSemester: p.activity.targetSemester,
    date: p.activity.startDate.toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric",
    }),
    location: p.activity.location || "-",
    joinedAt: p.joinedAt.toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric",
    }),
  }))

  return (
    <CertificatePrint
      student={{
        studentId: student.studentId,
        prefix: student.prefix,
        firstName: student.firstName,
        lastName: student.lastName,
        department: student.department,
        year: student.year,
      }}
      activities={activities}
      printedAt={new Date().toLocaleDateString("th-TH", {
        year: "numeric", month: "long", day: "numeric",
      })}
    />
  )
}
