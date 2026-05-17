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
      </div>

      <ImportStudentsForm />
    </div>
  )
}
