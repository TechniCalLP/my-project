import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { scoreCorrectionReviewSchema } from "@/lib/validations"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin" || session.user.adminRole !== "SUPER_ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = scoreCorrectionReviewSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 })
    }
    const { status, reviewNote } = parsed.data

    const request = await prisma.vocationalScoreCorrectionRequest.findUnique({ where: { id } })
    if (!request) return Response.json({ error: "ไม่พบคำขอ" }, { status: 404 })
    if (request.status !== "PENDING") {
      return Response.json({ error: "คำขอนี้ถูกดำเนินการไปแล้ว" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      if (status === "APPROVED") {
        await tx.vocationalActivityScore.update({
          where: {
            vocationalActivityId_studentId: {
              vocationalActivityId: request.vocationalActivityId,
              studentId: request.studentId,
            },
          },
          data: { score: request.proposedScore, isDraft: false, enteredById: session.user.id },
        })
      }
      await tx.vocationalScoreCorrectionRequest.update({
        where: { id },
        data: {
          status,
          reviewNote: reviewNote || null,
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      })
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Review score correction request error:", error)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
