import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordForm } from "@/components/forms/password-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle } from "lucide-react"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id: session.user.id },
    select: { studentId: true, prefix: true, firstName: true, lastName: true, year: true, department: true },
  })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-thai">ตั้งค่าบัญชี</h1>

      {session.user.isFirstLogin && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="font-thai text-yellow-800">
            คุณเข้าสู่ระบบครั้งแรก กรุณาเปลี่ยนรหัสผ่านเพื่อความปลอดภัย
          </AlertDescription>
        </Alert>
      )}

      {student && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai">ข้อมูลของคุณ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-thai">รหัสนักศึกษา</span>
                <span className="text-sm font-mono font-medium">{student.studentId}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-thai">ชื่อ-นามสกุล</span>
                <span className="text-sm font-medium font-thai">
                  {student.prefix}{student.firstName} {student.lastName}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-thai">ระดับชั้น</span>
                <span className="text-sm font-medium font-thai">{student.year}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-thai">แผนก</span>
                <span className="text-sm font-medium font-thai">{student.department}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">เปลี่ยนรหัสผ่าน</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
