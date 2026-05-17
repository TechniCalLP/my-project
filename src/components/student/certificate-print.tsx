"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface Activity {
  name: string
  category: string
  targetYear: string
  targetSemester: string
  date: string
  location: string
  joinedAt: string
}

interface Student {
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  department: string
  year: string
}

interface CertificatePrintProps {
  student: Student
  activities: Activity[]
  printedAt: string
}

export default function CertificatePrint({ student, activities, printedAt }: CertificatePrintProps) {
  const fullName = `${student.prefix}${student.firstName} ${student.lastName}`
  const yearLabel = student.year

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print button — hidden on print */}
      <div className="print:hidden flex justify-center gap-3 py-4 bg-white border-b shadow-sm">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />
          พิมพ์ / บันทึก PDF
        </Button>
      </div>

      {/* Certificate body */}
      <div className="max-w-3xl mx-auto my-8 print:my-0 bg-white shadow-lg print:shadow-none p-12 print:p-8">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-blue-800 pb-6">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo-college.png"
              alt="Logo วิทยาลัย"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 font-thai mb-1">
            ใบรับรองการเข้าร่วมกิจกรรม
          </h1>
          <p className="text-sm text-gray-500 font-thai">Activity Participation Certificate</p>
        </div>

        {/* Student info */}
        <div className="mb-8 bg-blue-50 print:bg-gray-50 rounded-lg p-5 grid grid-cols-2 gap-y-2 text-sm font-thai">
          <div>
            <span className="text-gray-500">ชื่อ-สกุล: </span>
            <span className="font-semibold">{fullName}</span>
          </div>
          <div>
            <span className="text-gray-500">รหัสนักศึกษา: </span>
            <span className="font-semibold">{student.studentId}</span>
          </div>
          <div>
            <span className="text-gray-500">แผนก: </span>
            <span className="font-semibold">{student.department}</span>
          </div>
          <div>
            <span className="text-gray-500">ระดับชั้น: </span>
            <span className="font-semibold">{yearLabel}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">จำนวนกิจกรรมที่เข้าร่วมทั้งหมด: </span>
            <span className="font-bold text-blue-800">{activities.length} กิจกรรม</span>
          </div>
        </div>

        {/* Activity table */}
        {activities.length === 0 ? (
          <p className="text-center text-gray-400 font-thai py-8">ยังไม่มีประวัติการเข้าร่วมกิจกรรม</p>
        ) : (
          <table className="w-full text-sm font-thai border-collapse">
            <thead>
              <tr className="bg-blue-800 print:bg-gray-800 text-white">
                <th className="px-3 py-2 text-center w-10">ลำดับ</th>
                <th className="px-3 py-2 text-left">ชื่อกิจกรรม</th>
                <th className="px-3 py-2 text-center w-28">ประเภท</th>
                <th className="px-3 py-2 text-center w-28">ปีการศึกษา</th>
                <th className="px-3 py-2 text-center w-32">วันที่จัดกิจกรรม</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2 text-center text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 print:bg-gray-200 print:text-gray-800">
                      {a.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">
                    {a.targetYear} {a.targetSemester}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div className="mt-10 flex justify-between items-end text-xs text-gray-400 font-thai border-t pt-4">
          <span>พิมพ์เมื่อ: {printedAt}</span>
          <span>ระบบบริหารจัดการกิจกรรมนักศึกษา</span>
        </div>
      </div>
    </div>
  )
}
