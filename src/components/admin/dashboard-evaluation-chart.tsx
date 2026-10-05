"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardEvaluationChartProps {
  passCount: number
  failCount: number
  pendingCount: number
  topActivities: { name: string; participants: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  "ผ่าน": "#2E9283",
  "ไม่ผ่าน": "#EF4444",
  "รอดำเนินการ": "#9CA3AF",
}

function truncateLabel(name: string, max = 16) {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

export default function DashboardEvaluationChart({
  passCount,
  failCount,
  pendingCount,
  topActivities,
}: DashboardEvaluationChartProps) {
  const total = passCount + failCount + pendingCount
  const pieData = [
    { name: "ผ่าน", value: passCount },
    { name: "ไม่ผ่าน", value: failCount },
    { name: "รอดำเนินการ", value: pendingCount },
  ]

  return (
    <div className="font-thai grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-base">สัดส่วนผลการประเมินกิจกรรมบังคับ ({total.toLocaleString("th-TH")} คน)</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-center text-gray-400 font-thai py-16 text-sm">ยังไม่มีข้อมูลสำหรับภาคเรียนนี้</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry: { name?: string; value?: number }) => `${entry.name ?? ""} ${entry.value ?? 0}`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontFamily: "inherit" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-base">กิจกรรมที่มีผู้เข้าร่วมมากที่สุด</CardTitle>
        </CardHeader>
        <CardContent>
          {topActivities.length === 0 ? (
            <p className="text-center text-gray-400 font-thai py-16 text-sm">ยังไม่มีผู้เข้าร่วมกิจกรรม</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topActivities} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) => truncateLabel(value)}
                />
                <Tooltip />
                <Bar dataKey="participants" name="ผู้เข้าร่วม" fill="#2E3192" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
