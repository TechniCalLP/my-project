import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStudentEvaluations, type PartStatus } from "@/lib/evaluation"
import { resolveDepartmentVariants } from "@/lib/department"
import { clubDepartmentVariants, resolveClubById } from "@/lib/club"
import { getCollegeLogo } from "@/lib/settings"
import ExcelJS from "exceljs"
import * as fs from "fs"
import * as path from "path"

const COLLEGE_NAME = "วิทยาลัยเทคนิคลำปาง"

const THIN_BORDER = { style: "thin" as const, color: { argb: "FF000000" } }
const BORDER_ALL = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER }

function overallLabel(status: PartStatus) {
  return status === "PASS" ? "ผ่าน" : status === "FAIL" ? "ไม่ผ่าน" : "รอดำเนินการ"
}

/** Loads the college logo as embeddable image bytes — the custom uploaded logo when it's a
 *  rasterizable format (exceljs can't embed SVG), otherwise the bundled default PNG. */
function loadLogoImage(logoDataUrl: string | null): { buffer: Buffer; extension: "png" | "jpeg" } {
  if (logoDataUrl?.startsWith("data:image/png")) {
    return { buffer: Buffer.from(logoDataUrl.split(",")[1], "base64"), extension: "png" }
  }
  if (logoDataUrl?.startsWith("data:image/jpeg")) {
    return { buffer: Buffer.from(logoDataUrl.split(",")[1], "base64"), extension: "jpeg" }
  }
  return { buffer: fs.readFileSync(path.join(process.cwd(), "public", "logo-college.png")), extension: "png" }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const year = searchParams.get("year")
  const academicYear = searchParams.get("academicYear")
  const semester = searchParams.get("semester")
  const formType = searchParams.get("formType") === "17" ? "17" : "15"

  if (!year || !academicYear || !semester) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  let deptVariants: string[] | undefined
  let clubName: string | undefined
  if (session.user.adminRole === "TEACHER") {
    const teacher = await prisma.admin.findUnique({
      where: { id: session.user.id },
      include: { club: { include: { departments: true } } },
    })
    if (!teacher?.club) {
      return NextResponse.json({ error: "บัญชีของท่านยังไม่ได้ผูกกับชมรม" }, { status: 403 })
    }
    deptVariants = clubDepartmentVariants(teacher.club)
    clubName = teacher.club.name
  } else {
    const clubId = searchParams.get("club") ?? undefined
    const department = searchParams.get("department") ?? undefined
    if (clubId) {
      const club = await resolveClubById(clubId)
      deptVariants = club ? clubDepartmentVariants(club) : undefined
      clubName = club?.name
    } else {
      deptVariants = department ? await resolveDepartmentVariants(department) : undefined
    }
  }

  const students = await prisma.student.findMany({
    where: { isActive: true, year, ...(deptVariants ? { department: { in: deptVariants } } : {}) },
    orderBy: [{ department: "asc" }, { group: "asc" }, { studentId: "asc" }],
  })

  const evaluations = await getStudentEvaluations(students.map((s) => s.id), academicYear, semester)

  const requiredActivityNames: string[] = []
  const vocationalActivityNames: string[] = []
  for (const s of students) {
    const ev = evaluations.get(s.id)
    for (const a of ev?.requiredActivities ?? []) {
      if (!requiredActivityNames.includes(a.name)) requiredActivityNames.push(a.name)
    }
    for (const a of ev?.vocationalActivities ?? []) {
      if (!vocationalActivityNames.includes(a.name)) vocationalActivityNames.push(a.name)
    }
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(`อวท.${formType} ${year}`.slice(0, 31))

  // Column plan: ที่ | รหัสนักศึกษา | ชื่อ-สกุล สมาชิก | แผนกวิชา ชั้นปี/กลุ่ม | [กิจกรรมภาคบังคับ...] | [กิจกรรมองค์การวิชาชีพ...] | ผลการประเมิน
  // (formType 17 skips the two activity-group sections in favor of ผ่าน/ไม่ผ่าน/หมายเหตุ)
  const fixedCols = [
    { header: "ที่", width: 6 },
    { header: "รหัสนักศึกษา", width: 15 },
    { header: "ชื่อ-สกุล สมาชิก", width: 28 },
    { header: "แผนกวิชา ชั้นปี/กลุ่ม", width: 20 },
  ]

  const requiredCols = formType === "15" ? (requiredActivityNames.length > 0 ? requiredActivityNames : ["กิจกรรมภาคบังคับ"]) : []
  const vocationalCols = formType === "15" ? (vocationalActivityNames.length > 0 ? vocationalActivityNames : ["กิจกรรมองค์การวิชาชีพ"]) : []
  const tailCols = formType === "15" ? [{ header: "ผลการประเมิน", width: 14 }] : [
    { header: "ผ่าน", width: 8 },
    { header: "ไม่ผ่าน", width: 8 },
    { header: "หมายเหตุ", width: 16 },
  ]

  const totalCols = fixedCols.length + requiredCols.length + vocationalCols.length + tailCols.length

  sheet.columns = [
    ...fixedCols,
    ...requiredCols.map((name) => ({ header: name, width: 13 })),
    ...vocationalCols.map((name) => ({ header: name, width: 14 })),
    ...tailCols,
  ]
  // Row 1 is reserved for headers written manually below, not exceljs' auto header row.
  sheet.spliceRows(1, 1)

  // --- Logo + title block ---
  const logo = loadLogoImage(await getCollegeLogo())
  const imageId = workbook.addImage({ buffer: logo.buffer as unknown as ExcelJS.Buffer, extension: logo.extension })
  sheet.mergeCells(1, 1, 3, totalCols)
  sheet.getRow(1).height = 30
  sheet.getRow(2).height = 60
  sheet.getRow(3).height = 20
  sheet.addImage(imageId, {
    tl: { col: totalCols / 2 - 1, row: 0.3 },
    ext: { width: 60, height: 60 },
  })

  let rowIdx = 4
  const titleRow = sheet.getRow(rowIdx++)
  titleRow.getCell(1).value = `แบบสรุปการประเมินผลกิจกรรมองค์การวิชาชีพ ระดับชั้น ${year}`
  sheet.mergeCells(titleRow.number, 1, titleRow.number, totalCols)
  titleRow.getCell(1).font = { bold: true, size: 14 }
  titleRow.getCell(1).alignment = { horizontal: "center" }

  const collegeRow = sheet.getRow(rowIdx++)
  collegeRow.getCell(1).value = COLLEGE_NAME
  sheet.mergeCells(collegeRow.number, 1, collegeRow.number, totalCols)
  collegeRow.getCell(1).alignment = { horizontal: "center" }

  const infoRow = sheet.getRow(rowIdx++)
  const semesterLabel = semester.replace("ภาคเรียนที่ ", "")
  infoRow.getCell(1).value = `ชมรมวิชาชีพ${clubName ?? "................................."}   ภาคเรียนที่ ${semesterLabel} ปีการศึกษา ${academicYear}`
  sheet.mergeCells(infoRow.number, 1, infoRow.number, totalCols)
  infoRow.getCell(1).alignment = { horizontal: "center" }
  rowIdx++ // spacer row

  // --- Table header (2 rows: group headers + sub headers) ---
  const headerRow1 = sheet.getRow(rowIdx)
  const headerRow2 = sheet.getRow(rowIdx + 1)
  headerRow1.height = 22
  headerRow2.height = 22

  let col = 1
  for (const c of fixedCols) {
    headerRow1.getCell(col).value = c.header
    sheet.mergeCells(headerRow1.number, col, headerRow2.number, col)
    col++
  }
  if (formType === "15") {
    if (requiredCols.length > 0) {
      headerRow1.getCell(col).value = "กิจกรรมภาคบังคับ"
      sheet.mergeCells(headerRow1.number, col, headerRow1.number, col + requiredCols.length - 1)
      for (const name of requiredCols) {
        headerRow2.getCell(col).value = name
        col++
      }
    }
    if (vocationalCols.length > 0) {
      const startCol = col
      headerRow1.getCell(col).value = "กิจกรรมองค์การวิชาชีพ"
      sheet.mergeCells(headerRow1.number, startCol, headerRow1.number, startCol + vocationalCols.length - 1)
      for (const name of vocationalCols) {
        headerRow2.getCell(col).value = name
        col++
      }
    }
    headerRow1.getCell(col).value = "ผลการประเมิน"
    sheet.mergeCells(headerRow1.number, col, headerRow2.number, col)
  } else {
    headerRow1.getCell(col).value = "ผลการประเมินกิจกรรม"
    sheet.mergeCells(headerRow1.number, col, headerRow1.number, col + 1)
    headerRow2.getCell(col).value = "ผ่าน"
    headerRow2.getCell(col + 1).value = "ไม่ผ่าน"
    col += 2
    headerRow1.getCell(col).value = "หมายเหตุ"
    sheet.mergeCells(headerRow1.number, col, headerRow2.number, col)
  }

  for (const r of [headerRow1, headerRow2]) {
    for (let c = 1; c <= totalCols; c++) {
      const cell = r.getCell(c)
      cell.font = { bold: true }
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
      cell.border = BORDER_ALL
    }
  }

  rowIdx += 2

  // --- Data rows ---
  let passCount = 0
  let failCount = 0
  for (const [i, s] of students.entries()) {
    const ev = evaluations.get(s.id)!
    if (ev.overall === "PASS") passCount++
    else if (ev.overall === "FAIL") failCount++

    const row = sheet.getRow(rowIdx++)
    let c = 1
    row.getCell(c++).value = i + 1
    row.getCell(c++).value = s.studentId
    row.getCell(c++).value = `${s.prefix}${s.firstName} ${s.lastName}`
    row.getCell(c++).value = `${s.department} / กลุ่ม ${s.group ?? "-"}`

    if (formType === "15") {
      if (requiredActivityNames.length > 0) {
        for (const name of requiredActivityNames) {
          const found = ev.requiredActivities.find((a) => a.name === name)
          row.getCell(c++).value = found?.joined ? "ผ่าน" : "ไม่ผ่าน"
        }
      } else {
        row.getCell(c++).value = "-"
      }
      if (vocationalActivityNames.length > 0) {
        for (const name of vocationalActivityNames) {
          const found = ev.vocationalActivities.find((a) => a.name === name)
          row.getCell(c++).value = found ? (found.score != null ? `${found.score}%` : "รอกรอก") : "-"
        }
      } else {
        row.getCell(c++).value = "-"
      }
      row.getCell(c++).value = overallLabel(ev.overall)
    } else {
      row.getCell(c++).value = ev.overall === "PASS" ? "✓" : ""
      row.getCell(c++).value = ev.overall === "FAIL" ? "✓" : ""
      row.getCell(c++).value = ev.overall === "PENDING" ? "รอดำเนินการ" : ""
    }

    for (let cc = 1; cc <= totalCols; cc++) {
      const cell = row.getCell(cc)
      cell.border = BORDER_ALL
      cell.alignment = { horizontal: cc <= 3 ? "left" : "center", vertical: "middle" }
    }
  }

  // --- Summary + footer ---
  rowIdx++
  const total = students.length
  const passPct = total > 0 ? ((passCount / total) * 100).toFixed(2) : "0.00"
  const failPct = total > 0 ? ((failCount / total) * 100).toFixed(2) : "0.00"

  const summaryLines = [
    `สรุปผลการประเมินกิจกรรมองค์การวิชาชีพ สมาชิกจำนวน ${total} คน`,
    `ผ่าน ${passCount} คน คิดเป็นร้อยละ ${passPct}`,
    `ไม่ผ่าน ${failCount} คน คิดเป็นร้อยละ ${failPct}`,
  ]
  for (const line of summaryLines) {
    const row = sheet.getRow(rowIdx++)
    row.getCell(1).value = line
    sheet.mergeCells(row.number, 1, row.number, totalCols)
  }

  rowIdx++
  const noteRow = sheet.getRow(rowIdx++)
  noteRow.getCell(1).value =
    "ทั้งนี้ ให้สมาชิกที่ไม่ผ่านการประเมินกิจกรรมองค์การวิชาชีพ ติดต่อยื่นคำร้องขอซ่อมกิจกรรม ต่อคณะกรรมการผลการประเมินกิจกรรม พร้อมชำระเงินค่าลงทะเบียนซ่อมกิจกรรม ตามระเบียบและแนวปฏิบัติที่เกี่ยวข้อง ต่อไป"
  sheet.mergeCells(noteRow.number, 1, noteRow.number, totalCols)
  noteRow.getCell(1).alignment = { wrapText: true }
  noteRow.height = 30

  rowIdx += 2
  if (formType === "15") {
    const positions = ["นายทะเบียนชมรมวิชาชีพ", "นายทะเบียนองค์การ", "หัวหน้างานกิจกรรมฯ", "รองฯฝ่ายกิจการฯ"]
    const half = Math.ceil(totalCols / 2)
    for (let i = 0; i < positions.length; i += 2) {
      for (const [offset, position] of [positions[i], positions[i + 1]].entries()) {
        if (!position) continue
        const startCol = offset === 0 ? 1 : half + 1
        const endCol = offset === 0 ? half : totalCols
        const signRow = sheet.getRow(rowIdx)
        signRow.getCell(startCol).value = "ลงชื่อ................................."
        signRow.getCell(startCol).alignment = { horizontal: "center" }
        sheet.mergeCells(signRow.number, startCol, signRow.number, endCol)
        const nameRow = sheet.getRow(rowIdx + 1)
        nameRow.getCell(startCol).value = "(.................................)"
        nameRow.getCell(startCol).alignment = { horizontal: "center" }
        sheet.mergeCells(nameRow.number, startCol, nameRow.number, endCol)
        const posRow = sheet.getRow(rowIdx + 2)
        posRow.getCell(startCol).value = position
        posRow.getCell(startCol).alignment = { horizontal: "center" }
        sheet.mergeCells(posRow.number, startCol, posRow.number, endCol)
      }
      rowIdx += 4
    }
  } else {
    const signRow = sheet.getRow(rowIdx++)
    signRow.getCell(1).value = "ลงชื่อ................................."
    signRow.getCell(1).alignment = { horizontal: "center" }
    sheet.mergeCells(signRow.number, 1, signRow.number, totalCols)
    const nameRow = sheet.getRow(rowIdx++)
    nameRow.getCell(1).value = "(.................................)"
    nameRow.getCell(1).alignment = { horizontal: "center" }
    sheet.mergeCells(nameRow.number, 1, nameRow.number, totalCols)
    const posRow = sheet.getRow(rowIdx++)
    posRow.getCell(1).value = "ประธานกรรมการการประเมินผลกิจกรรมองค์การวิชาชีพ"
    posRow.getCell(1).alignment = { horizontal: "center" }
    sheet.mergeCells(posRow.number, 1, posRow.number, totalCols)
  }

  const buf = await workbook.xlsx.writeBuffer()
  const fileName = `summary_${year}_${academicYear}_${semester}_avt${formType}.xlsx`

  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
