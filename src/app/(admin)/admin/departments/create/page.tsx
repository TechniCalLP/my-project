import DepartmentForm from "@/components/admin/department-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateDepartmentPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/departments">
          <Button variant="ghost" size="sm" className="font-thai gap-1 text-gray-500 mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-thai">เพิ่มแผนก</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลแผนก</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentForm />
        </CardContent>
      </Card>
    </div>
  )
}
