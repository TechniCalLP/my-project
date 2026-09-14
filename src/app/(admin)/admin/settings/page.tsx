import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import SignatureUpload from "@/components/admin/signature-upload"
import { getDeputyDirectorSignature } from "@/lib/settings"

export default async function AdminSettingsPage() {
  const signature = await getDeputyDirectorSignature()

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-600" />
          <h1 className="text-xl md:text-2xl font-bold font-thai">ตั้งค่าระบบ</h1>
        </div>
        <p className="text-gray-500 font-thai mt-1 text-sm">ตั้งค่าที่ใช้ร่วมกันทั้งระบบ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-base">ลายเซ็นสำหรับเอกสาร</CardTitle>
        </CardHeader>
        <CardContent>
          <SignatureUpload initialSignature={signature} />
        </CardContent>
      </Card>
    </div>
  )
}
