import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: activityId } = await params
  const body = await req.json()
  const studentId = typeof body.studentId === "string" ? body.studentId : ""
  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (!studentId) {
    return Response.json({ error: "กรุณาเลือกนักศึกษา" }, { status: 400 })
  }
  if (!note) {
    return Response.json({ error: "กรุณาระบุเหตุผลที่เพิ่มด้วยตนเอง" }, { status: 400 })
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } })
  if (!activity || activity.isDeleted) {
    return Response.json({ error: "ไม่พบกิจกรรม" }, { status: 404 })
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) {
    return Response.json({ error: "ไม่พบนักศึกษา" }, { status: 404 })
  }

  const existing = await prisma.participation.findFirst({ where: { studentId, activityId } })
  if (existing) {
    return Response.json({ error: "นักศึกษาคนนี้เข้าร่วมกิจกรรมนี้อยู่แล้ว" }, { status: 400 })
  }

  const participation = await prisma.participation.create({
    data: {
      studentId,
      activityId,
      codeUsed: null,
      addedById: session.user.id,
      addNote: note,
    },
  })

  return Response.json(participation, { status: 201 })
}
