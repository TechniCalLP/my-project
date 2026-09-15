import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AutoPrint from "@/components/admin/auto-print"
import { CollegeLogoImage } from "@/components/layout/college-logo-image"
import { getStudentEvaluations, type PartStatus } from "@/lib/evaluation"
import { resolveDepartmentVariants } from "@/lib/department"
import { clubDepartmentVariants, resolveClubNamesForDepartments, resolveClubById } from "@/lib/club"
import { getActiveDocumentSignature, getCollegeLogo } from "@/lib/settings"

interface PageProps {
  searchParams: Promise<{ year?: string; academicYear?: string; semester?: string; department?: string; club?: string; formType?: string }>
}

const COLLEGE_NAME = "วิทยาลัยเทคนิคลำปาง"

export default async function PrintSummaryPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") redirect("/admin/login")

  const params = await searchParams
  const { year, academicYear, semester } = params
  if (!year || !academicYear || !semester) redirect("/admin/summary")
  const formType = params.formType === "15" ? "15" : "17"

  let deptVariants: string[] | undefined
  if (session.user.adminRole === "TEACHER") {
    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { club: { include: { departments: true } } },
    })
    deptVariants = teacher?.club ? clubDepartmentVariants(teacher.club) : undefined
  } else if (params.club) {
    const club = await resolveClubById(params.club)
    deptVariants = club ? clubDepartmentVariants(club) : undefined
  } else {
    const department = params.department ?? undefined
    deptVariants = department ? await resolveDepartmentVariants(department) : undefined
  }

  const students = await prisma.student.findMany({
    where: { isActive: true, year, ...(deptVariants ? { department: { in: deptVariants } } : {}) },
    orderBy: [{ department: "asc" }, { group: "asc" }, { studentId: "asc" }],
  })

  const evaluations = await getStudentEvaluations(students.map((s) => s.id), academicYear, semester)

  const clubNameByDepartment = await resolveClubNamesForDepartments(students.map((s) => s.department))

  const pages = new Map<string, { department: string; group: string | null; students: typeof students }>()
  for (const s of students) {
    const key = `${s.department}::${s.group ?? ""}`
    if (!pages.has(key)) pages.set(key, { department: s.department, group: s.group, students: [] })
    pages.get(key)!.students.push(s)
  }

  const signature = await getActiveDocumentSignature()
  const logoUrl = await getCollegeLogo()

  const now = new Date()
  const printedAt = now.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
  const printDay = now.toLocaleDateString("th-TH", { day: "numeric" })
  const printMonth = now.toLocaleDateString("th-TH", { month: "long" })
  const printYear = now.toLocaleDateString("th-TH", { year: "numeric" })

  const overallForStudent = (studentId: string): PartStatus => evaluations.get(studentId)?.overall ?? "PENDING"

  const statusLabel = (s: PartStatus) => (s === "PASS" ? "ผ่าน" : s === "FAIL" ? "ไม่ผ่าน" : "รอดำเนินการ")

  return (
    <div className="min-h-screen bg-white font-thai">
      <AutoPrint />

      {[...pages.values()].map((pageGroup, pageIndex) => {
        const total = pageGroup.students.length
        const passCount = pageGroup.students.filter((s) => overallForStudent(s.id) === "PASS").length
        const failCount = pageGroup.students.filter((s) => overallForStudent(s.id) === "FAIL").length
        const passPct = total > 0 ? ((passCount / total) * 100).toFixed(2) : "0.00"
        const failPct = total > 0 ? ((failCount / total) * 100).toFixed(2) : "0.00"

        const activityColumns: { id: string; name: string }[] = []
        for (const s of pageGroup.students) {
          for (const a of evaluations.get(s.id)?.vocationalActivities ?? []) {
            if (!activityColumns.some((c) => c.id === a.id)) activityColumns.push({ id: a.id, name: a.name })
          }
        }

        return (
          <div
            key={pageIndex}
            className={`max-w-4xl mx-auto p-10 print:p-8 ${pageIndex > 0 ? "print:break-before-page" : ""}`}
          >
            <p className="text-right text-xs text-gray-400 mb-2">แบบ อวท.{formType}</p>

            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <CollegeLogoImage logoUrl={logoUrl} alt="Logo วิทยาลัย" width={64} height={64} className="object-contain" />
              </div>
              <h1 className="text-lg font-bold">ประกาศผลการประเมินกิจกรรมองค์การวิชาชีพ</h1>
              <p className="text-sm">
                ชมรมวิชาชีพ{clubNameByDepartment.get(pageGroup.department) ?? pageGroup.department} {COLLEGE_NAME}
              </p>
              <p className="text-sm mt-1">
                ภาคเรียนที่ {semester.replace("ภาคเรียนที่ ", "")} ปีการศึกษา {academicYear}
              </p>
              <p className="text-sm mt-1">
                ระดับชั้น {year} กลุ่ม {pageGroup.group ?? "-"}
              </p>
            </div>

            {formType === "15" ? (
              <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="border border-gray-800 px-2 py-1.5 w-10">ที่</th>
                    <th className="border border-gray-800 px-2 py-1.5 w-32">รหัสนักศึกษา</th>
                    <th className="border border-gray-800 px-2 py-1.5">ชื่อ - สกุล</th>
                    <th className="border border-gray-800 px-2 py-1.5 w-28">กิจกรรมภาคบังคับ</th>
                    {activityColumns.length === 0 ? (
                      <th className="border border-gray-800 px-2 py-1.5">กิจกรรมองค์การวิชาชีพ</th>
                    ) : (
                      activityColumns.map((col) => (
                        <th key={col.id} className="border border-gray-800 px-2 py-1.5">{col.name}</th>
                      ))
                    )}
                    <th className="border border-gray-800 px-2 py-1.5 w-20">ผลรวม</th>
                  </tr>
                </thead>
                <tbody>
                  {pageGroup.students.map((s, i) => {
                    const evaluation = evaluations.get(s.id)
                    const participation = evaluation?.participation ?? { progress: 0, status: "PENDING" as PartStatus }
                    const vocationalActivities = evaluation?.vocationalActivities ?? []
                    const overall = overallForStudent(s.id)
                    return (
                      <tr key={s.id}>
                        <td className="border border-gray-800 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-800 px-2 py-1 font-mono text-xs">{s.studentId}</td>
                        <td className="border border-gray-800 px-2 py-1 whitespace-nowrap">{s.prefix}{s.firstName} {s.lastName}</td>
                        <td className="border border-gray-800 px-2 py-1 text-center">
                          {participation.progress}%
                        </td>
                        {activityColumns.length === 0 ? (
                          <td className="border border-gray-800 px-2 py-1 text-center">
                            <span className="text-xs text-gray-400">ไม่มีกิจกรรม</span>
                          </td>
                        ) : (
                          activityColumns.map((col) => {
                            const a = vocationalActivities.find((va) => va.id === col.id)
                            return (
                              <td key={col.id} className="border border-gray-800 px-2 py-1 text-center">
                                {a ? (a.score != null ? `${a.score}%` : "รอกรอก") : "-"}
                              </td>
                            )
                          })
                        )}
                        <td className="border border-gray-800 px-2 py-1 text-center">
                          {statusLabel(overall)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-gray-800 px-2 py-1.5 w-10">ที่</th>
                    <th rowSpan={2} className="border border-gray-800 px-2 py-1.5 w-32">รหัสนักศึกษา</th>
                    <th rowSpan={2} className="border border-gray-800 px-2 py-1.5">ชื่อ - สกุล</th>
                    <th colSpan={2} className="border border-gray-800 px-2 py-1.5">ผลการประเมินกิจกรรม</th>
                    <th rowSpan={2} className="border border-gray-800 px-2 py-1.5 w-24">หมายเหตุ</th>
                  </tr>
                  <tr>
                    <th className="border border-gray-800 px-2 py-1 w-16">ผ่าน</th>
                    <th className="border border-gray-800 px-2 py-1 w-16">ไม่ผ่าน</th>
                  </tr>
                </thead>
                <tbody>
                  {pageGroup.students.map((s, i) => {
                    const overall = overallForStudent(s.id)
                    return (
                      <tr key={s.id}>
                        <td className="border border-gray-800 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-800 px-2 py-1 font-mono text-xs">{s.studentId}</td>
                        <td className="border border-gray-800 px-2 py-1 whitespace-nowrap">{s.prefix}{s.firstName} {s.lastName}</td>
                        <td className="border border-gray-800 px-2 py-1 text-center">{overall === "PASS" ? "✓" : ""}</td>
                        <td className="border border-gray-800 px-2 py-1 text-center">{overall === "FAIL" ? "✓" : ""}</td>
                        <td className="border border-gray-800 px-2 py-1 text-center text-xs text-gray-500">
                          {overall === "PENDING" ? "รอดำเนินการ" : ""}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            <div className="mt-5 text-sm space-y-1">
              <p>สรุปผลการประเมินกิจกรรมองค์การวิชาชีพ สมาชิกจำนวน {total} คน</p>
              <p>ผ่าน {passCount} คน คิดเป็นร้อยละ {passPct}</p>
              <p>ไม่ผ่าน {failCount} คน คิดเป็นร้อยละ {failPct}</p>
            </div>

            <p className="mt-5 text-sm leading-relaxed">
              ทั้งนี้ ให้สมาชิกที่ไม่ผ่านการประเมินกิจกรรมองค์การวิชาชีพ ติดต่อยื่นคำร้องขอซ่อมกิจกรรม
              ต่อคณะกรรมการผลการประเมินกิจกรรม พร้อมชำระเงินค่าลงทะเบียนซ่อมกิจกรรม ตามระเบียบและแนวปฏิบัติ
              ที่เกี่ยวข้อง ต่อไป
            </p>

            <div className="mt-12 flex justify-end">
              <div className="text-center text-sm space-y-1">
                {signature ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signature.imageData} alt="ลายเซ็น" className="h-14 mx-auto object-contain" />
                    <p>({signature.name})</p>
                    <p>{signature.position}</p>
                  </>
                ) : (
                  <>
                    <p>ลงชื่อ.................................</p>
                    <p>(.................................)</p>
                    <p>รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียน นักศึกษา</p>
                  </>
                )}
                <p>ประธานกรรมการการประเมินผลกิจกรรมองค์การวิชาชีพ</p>
                <p>{COLLEGE_NAME}</p>
                <p>{printDay} / {printMonth} / {printYear}</p>
              </div>
            </div>

            <div className="mt-8 text-xs text-gray-400 border-t pt-2">
              <span>พิมพ์เมื่อ: {printedAt}</span>
            </div>
          </div>
        )
      })}

      {pages.size === 0 && (
        <p className="text-center text-gray-500 py-12">ไม่พบนักศึกษาสำหรับเงื่อนไขนี้</p>
      )}
    </div>
  )
}
