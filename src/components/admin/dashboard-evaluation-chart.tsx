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
  LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardEvaluationChartProps {
  totalStudents: number
  passCount: number
  failCount: number
  byYear: { year: string; total: number; passed: number; failed: number; rateLabel: string }[]
  categoryFailCounts: { category: string; passed: number; failed: number }[]
  heatmap: { year: string; category: string; failRate: number }[]
}

const PASS_COLOR = "#15803D"
const FAIL_COLOR = "#DC2626"
const NEUTRAL_COLOR = "#9CA3AF"

function truncateLabel(name: string, max = 12) {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

function heatCellStyle(failRate: number) {
  // Single-hue sequential ramp (same red as FAIL_COLOR) — opacity rises with
  // the fail rate so 0% reads as white and 100% reads as solid red.
  const alpha = 0.06 + (failRate / 100) * 0.78
  return {
    backgroundColor: `rgba(220, 38, 38, ${alpha.toFixed(2)})`,
    color: failRate >= 55 ? "#ffffff" : "#7f1d1d",
  }
}

export default function DashboardEvaluationChart({
  totalStudents,
  passCount,
  failCount,
  byYear,
  categoryFailCounts,
  heatmap,
}: DashboardEvaluationChartProps) {
  if (totalStudents === 0) {
    return <p className="text-center text-gray-400 font-thai py-16 text-sm">ยังไม่มีข้อมูลสำหรับภาคเรียนนี้</p>
  }

  const passRate = Math.round((passCount / totalStudents) * 1000) / 10

  const pieData = [
    { name: "ผ่าน", value: passCount },
    { name: "ไม่ผ่าน", value: failCount },
  ]

  const rankedCategories = [...categoryFailCounts].sort((a, b) => b.failed - a.failed)
  const worstCategory = rankedCategories[0]

  const categories = categoryFailCounts.map((c) => c.category)
  const heatmapByYear = byYear.map(({ year }) => ({
    year,
    cells: categories.map((category) => heatmap.find((h) => h.year === year && h.category === category)),
  }))

  return (
    <div className="font-thai space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-thai text-base">ภาพรวมทั้งวิทยาลัย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.name === "ผ่าน" ? PASS_COLOR : FAIL_COLOR} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">{passRate}%</span>
                <span className="text-xs text-gray-500">ผ่าน</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PASS_COLOR }} />
                ผ่าน ({passCount.toLocaleString("th-TH")})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FAIL_COLOR }} />
                ไม่ผ่าน ({failCount.toLocaleString("th-TH")})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-thai text-base">ผ่าน / ไม่ผ่าน แยกตามชั้นปี</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byYear} margin={{ top: 24, bottom: 8, left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [`${value} คน`, name === "passed" ? "ผ่าน" : "ไม่ผ่าน"]}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "inherit" }}
                  formatter={(value) => (value === "passed" ? "ผ่าน" : "ไม่ผ่าน")}
                />
                <Bar dataKey="passed" name="passed" stackId="status" fill={PASS_COLOR} radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" name="failed" stackId="status" fill={FAIL_COLOR} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="rateLabel" position="top" style={{ fontSize: 11, fill: "#374151" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-thai text-base">จำนวนผู้ไม่ผ่าน แยกตามประเภทกิจกรรม</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rankedCategories} layout="vertical" margin={{ left: 10, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} คน`, "ไม่ผ่าน"]} />
                <Bar dataKey="failed" radius={[0, 4, 4, 0]}>
                  {rankedCategories.map((entry, i) => (
                    <Cell key={entry.category} fill={i === 0 ? FAIL_COLOR : NEUTRAL_COLOR} />
                  ))}
                  <LabelList dataKey="failed" position="right" style={{ fontSize: 12, fill: "#374151" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {worstCategory && worstCategory.failed > 0 && (
              <p className="text-xs text-red-600 mt-1">
                &ldquo;{worstCategory.category}&rdquo; มีผู้ไม่ผ่านมากที่สุด ({worstCategory.failed.toLocaleString("th-TH")} คน)
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-thai text-base">ชั้นปี × ประเภทกิจกรรม (% ไม่ผ่าน)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: "6px" }}>
              <thead>
                <tr>
                  <th className="text-left px-2 py-1.5 text-gray-500 font-normal">ชั้นปี</th>
                  {categories.map((c) => (
                    <th key={c} className="px-2 py-1.5 text-gray-500 font-normal text-center">
                      {truncateLabel(c, 10)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapByYear.map(({ year, cells }) => (
                  <tr key={year}>
                    <td className="px-2 py-2.5 font-medium">{year}</td>
                    {cells.map((cell, i) => (
                      <td
                        key={categories[i]}
                        className="px-2 py-2.5 text-center rounded-md"
                        style={heatCellStyle(cell?.failRate ?? 0)}
                      >
                        {cell?.failRate ?? 0}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <span>ไม่ผ่านต่ำ</span>
              <div
                className="flex-1 h-2 rounded"
                style={{ background: "linear-gradient(to right, rgba(220,38,38,0.06), rgba(220,38,38,0.84))" }}
              />
              <span>ไม่ผ่านสูง</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-base">ตารางสรุปผลกิจกรรมรายชั้นปี</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-2">ชั้นปี</th>
                <th className="px-2 py-2 text-right">ทั้งหมด</th>
                <th className="px-2 py-2 text-right">ผ่าน</th>
                <th className="px-2 py-2 text-right">ไม่ผ่าน</th>
                <th className="px-2 py-2 text-right">% ผ่าน</th>
                <th className="px-2 py-2 text-left w-1/3">สัดส่วนผ่าน</th>
              </tr>
            </thead>
            <tbody>
              {byYear.map((row) => {
                const rate = row.total > 0 ? Math.round((row.passed / row.total) * 1000) / 10 : 0
                return (
                  <tr key={row.year} className="border-b last:border-b-0">
                    <td className="px-2 py-2 font-medium">{row.year}</td>
                    <td className="px-2 py-2 text-right">{row.total.toLocaleString("th-TH")}</td>
                    <td className="px-2 py-2 text-right" style={{ color: PASS_COLOR }}>
                      {row.passed.toLocaleString("th-TH")}
                    </td>
                    <td className="px-2 py-2 text-right" style={{ color: FAIL_COLOR }}>
                      {row.failed.toLocaleString("th-TH")}
                    </td>
                    <td className="px-2 py-2 text-right">{rate}%</td>
                    <td className="px-2 py-2">
                      <div className="h-2 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${rate}%`, backgroundColor: PASS_COLOR }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold bg-gray-50">
                <td className="px-2 py-2">รวมทั้งหมด</td>
                <td className="px-2 py-2 text-right">{totalStudents.toLocaleString("th-TH")}</td>
                <td className="px-2 py-2 text-right" style={{ color: PASS_COLOR }}>
                  {passCount.toLocaleString("th-TH")}
                </td>
                <td className="px-2 py-2 text-right" style={{ color: FAIL_COLOR }}>
                  {failCount.toLocaleString("th-TH")}
                </td>
                <td className="px-2 py-2 text-right">{passRate}%</td>
                <td className="px-2 py-2">
                  <div className="h-2 bg-gray-100 rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${passRate}%`, backgroundColor: PASS_COLOR }} />
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
