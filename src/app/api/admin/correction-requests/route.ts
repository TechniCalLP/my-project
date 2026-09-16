import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const requests = await prisma.vocationalScoreCorrectionRequest.findMany({
    include: {
      vocationalActivity: { select: { name: true, academicYear: true, semester: true } },
      student: { select: { studentId: true, prefix: true, firstName: true, lastName: true, department: true } },
      requestedBy: { select: { name: true, username: true } },
      reviewedBy: { select: { name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(requests)
}
