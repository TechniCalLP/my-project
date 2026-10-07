import { Card, CardContent } from "@/components/ui/card"

interface DashboardKpiCardsProps {
  totalStudents: number
  passCount: number
  failCount: number
  categoryFailCounts: { category: string; passed: number; failed: number }[]
}

const PASS_COLOR = "#15803D"
const FAIL_COLOR = "#DC2626"

export default function DashboardKpiCards({
  totalStudents,
  passCount,
  failCount,
  categoryFailCounts,
}: DashboardKpiCardsProps) {
  const passRate = totalStudents > 0 ? Math.round((passCount / totalStudents) * 1000) / 10 : 0
  const failRate = totalStudents > 0 ? Math.round((failCount / totalStudents) * 1000) / 10 : 0
  const worstCategory = [...categoryFailCounts].sort((a, b) => b.failed - a.failed)[0]

  return (
    <div className="font-thai grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">นักศึกษาทั้งหมด</p>
          <p className="text-3xl font-bold mt-1">{totalStudents.toLocaleString("th-TH")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">
            ผ่าน <span className="text-xs">({passRate}%)</span>
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: PASS_COLOR }}>
            {passCount.toLocaleString("th-TH")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">
            ไม่ผ่าน <span className="text-xs">({failRate}%)</span>
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: FAIL_COLOR }}>
            {failCount.toLocaleString("th-TH")}
          </p>
        </CardContent>
      </Card>
      <Card className="border-red-300 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-700">ประเภทที่ตกมากที่สุด</p>
          <p className="text-lg font-bold mt-1 text-red-900">{worstCategory?.category ?? "-"}</p>
          <p className="text-sm text-red-700">{(worstCategory?.failed ?? 0).toLocaleString("th-TH")} คน</p>
        </CardContent>
      </Card>
    </div>
  )
}
