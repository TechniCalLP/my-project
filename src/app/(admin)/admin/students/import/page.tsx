import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ImportStudentsForm from "@/components/admin/import-students-form"

export default function ImportStudentsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/admin/students">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">Import นักศึกษา</h1>
        <p className="text-gray-500 font-thai mt-1">อัปโหลดไฟล์ CSV เพื่อ Import ข้อมูลนักศึกษา</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">คำแนะนำ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium font-thai mb-2">รูปแบบไฟล์ที่รองรับ</p>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="font-thai font-medium mb-1">1. ไฟล์มาตรฐาน (5 คอลัมน์):</p>
                <code className="text-xs font-mono text-gray-600">
                  studentId,firstName,lastName,department,year
                </code>
              </div>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="font-thai font-medium mb-1">2. ไฟล์เช็คชื่อจากวิทยาลัย:</p>
                <code className="text-xs font-mono text-gray-600">
                  เลขที่,รหัสนักศึกษา,ชื่อ,นามสกุล,แผนก,คาบ1,คาบ2,...
                </code>
                <ul className="mt-2 space-y-0.5 text-gray-600 font-thai">
                  <li>✓ ดึงเฉพาะคอลัมน์ที่ 2–5 (รหัส, ชื่อ, นามสกุล, แผนก)</li>
                  <li>✓ คำนวณชั้นปีจากรหัสนักศึกษาอัตโนมัติ</li>
                  <li>✓ ข้ามเลขที่และคาบเรียนทั้งหมด</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-md border border-amber-100 font-thai text-gray-600 space-y-0.5">
            <p className="font-medium text-gray-700 mb-1">ตัวอย่างการคำนวณชั้นปี</p>
            <p>• รหัส 67XXXXX → เข้าปี 67 (2567) → ชั้นปีที่ 1 (ปวช.1)</p>
            <p>• รหัส 66XXXXX → เข้าปี 66 (2566) → ชั้นปีที่ 2 (ปวช.2)</p>
            <p>• รหัส 65XXXXX → เข้าปี 65 (2565) → ชั้นปีที่ 3 (ปวช.3)</p>
            <p>• รหัส 64XXXXX → เข้าปี 64 (2564) → ชั้นปีที่ 4 (ปวส.1)</p>
          </div>
        </CardContent>
      </Card>

      <ImportStudentsForm />
    </div>
  )
}
