import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Ticket, CheckCircle2, XCircle } from "lucide-react"
import { GenerateCodesForm } from "@/components/admin/generate-codes-form"
import { DeleteCodeButton } from "@/components/admin/delete-code-button"
import { PrintCodesButton } from "@/components/admin/print-codes-button"

export default async function CodesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const { id } = await params

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      activityCodes: { orderBy: { code: "asc" } },
    },
  })

  if (!activity) notFound()

  const totalCodes = activity.activityCodes.length
  const usedCodes = activity.activityCodes.filter((c) => c.isUsed).length
  const unusedCodes = totalCodes - usedCodes

  const serializedCodes = activity.activityCodes.map((c) => ({
    id: c.id,
    code: c.code,
    isUsed: c.isUsed,
    usedAt: c.usedAt?.toISOString() ?? null,
  }))

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/activities/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-thai">จัดการรหัสกิจกรรม</h1>
            <p className="text-gray-500 font-thai">{activity.name}</p>
          </div>
        </div>
        <PrintCodesButton codes={serializedCodes} activityTitle={activity.name} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ticket className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-3xl font-bold">{totalCodes}</p>
                <p className="text-sm text-gray-500 font-thai mt-1">รหัสทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-3xl font-bold text-gray-600">{usedCodes}</p>
                <p className="text-sm text-gray-500 font-thai mt-1">ใช้ไปแล้ว</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-success" />
              <div>
                <p className="text-3xl font-bold text-success">{unusedCodes}</p>
                <p className="text-sm text-gray-500 font-thai mt-1">ยังไม่ได้ใช้</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Form */}
      <GenerateCodesForm activityId={id} />

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-thai">รายการรหัส</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.activityCodes.length === 0 ? (
            <p className="text-center text-gray-500 py-8 font-thai">ยังไม่มีรหัสกิจกรรม</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-thai">รหัส</TableHead>
                  <TableHead className="font-thai">สถานะ</TableHead>
                  <TableHead className="font-thai">วันที่ใช้</TableHead>
                  <TableHead className="font-thai">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serializedCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold text-lg tracking-widest">
                      {code.code}
                    </TableCell>
                    <TableCell>
                      {code.isUsed ? (
                        <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-thai">
                          ใช้แล้ว
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border border-green-200 font-thai">
                          ยังไม่ใช้
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-thai">
                      {code.usedAt
                        ? new Date(code.usedAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {!code.isUsed && (
                        <DeleteCodeButton codeId={code.id} code={code.code} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
