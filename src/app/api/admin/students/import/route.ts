import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import * as XLSX from "xlsx"

interface StudentRow {
  studentId: string
  prefix: string
  firstName: string
  lastName: string
  department: string
  year: number
}

const YEAR_MAP: Record<number, string> = {
  1: "ปวช.1", 2: "ปวช.2", 3: "ปวช.3", 4: "ปวส.1", 5: "ปวส.2",
}

// Sorted longest-first so "นางสาว" matches before "นาง"
const THAI_PREFIXES = ["นางสาว", "เด็กชาย", "เด็กหญิง", "ด.ช.", "ด.ญ.", "นาง", "นาย"]

const YEAR_LEVEL_MAP: Record<string, number> = {
  "ปวช.1": 1, "ปวช.2": 2, "ปวช.3": 3, "ปวส.1": 4, "ปวส.2": 5,
}

// "(ช.68(A1))" → "ปวช"  |  "(ส.69(E1))" → "ปวส"  |  not found → null
function detectLevelFromHeaders(rows: string[][], firstStudentIdx: number): "ปวช" | "ปวส" | null {
  for (let i = 0; i < firstStudentIdx; i++) {
    for (const cell of rows[i]) {
      if (/\(ช\./.test(cell)) return "ปวช"
      if (/\(ส\./.test(cell)) return "ปวส"
    }
  }
  return null
}

function calculateYear(studentId: string, level?: "ปวช" | "ปวส" | null): number {
  const currentYear = new Date().getFullYear() + 543
  const yearPrefix = parseInt(studentId.substring(0, 2))
  const enrollYear = 2500 + yearPrefix
  const yr = currentYear - enrollYear + 1

  if (level === "ปวส") {
    // ปวส.1 = 4, ปวส.2 = 5 in YEAR_MAP
    return Math.max(4, Math.min(5, yr + 3))
  }
  // ปวช.1 = 1, ปวช.2 = 2, ปวช.3 = 3
  return Math.max(1, Math.min(5, yr))
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0]
  const commaCount = (firstLine.match(/,/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  return tabCount > commaCount ? "\t" : ","
}

function extractPrefixAndName(raw: string): { prefix: string; firstName: string } {
  const name = raw.trim()
  for (const prefix of THAI_PREFIXES) {
    if (name.startsWith(prefix)) {
      return { prefix, firstName: name.slice(prefix.length).trim() }
    }
  }
  return { prefix: "", firstName: name }
}

function parseYearLevel(raw: string): number | null {
  return YEAR_LEVEL_MAP[raw.trim()] ?? null
}

function hasReplacementChars(rows: string[][]): boolean {
  return rows.some(row => row.some(cell => String(cell).includes("�")))
}

// For XLS files that XLSX reads as Latin-1: CP874 byte → Latin-1 code point → UTF-8 string.
// Re-encodes that string as UTF-8 bytes, then decodes as windows-874.
function fixThaiEncoding(s: string): string {
  try {
    return new TextDecoder("windows-874").decode(Buffer.from(s, "utf8"))
  } catch {
    return s
  }
}

// Read raw buffer as text, auto-detecting UTF-8 vs CP874
function bufferToRows(buf: Buffer): string[][] {
  // Check UTF-8 BOM
  const hasUtf8Bom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF

  let text: string
  if (hasUtf8Bom) {
    text = new TextDecoder("utf-8").decode(buf).replace(/^﻿/, "")
  } else {
    const utf8Attempt = new TextDecoder("utf-8", { fatal: false }).decode(buf)
    // If UTF-8 decode produced replacement chars, the file is likely CP874
    text = utf8Attempt.includes("�")
      ? new TextDecoder("windows-874").decode(buf)
      : utf8Attempt
  }

  const delimiter = detectDelimiter(text)
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter(line => line.trim())
    .map(line => line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, "")))
}

const DEPT_KEYWORDS = ["แผนกวิชา", "สาขาวิชา", "แผนก", "สาขา"]
const TITLE_SKIP = ["ใบรายชื่อ", "รายชื่อนักเรียน", "รายชื่อนักศึกษา", "รายงาน", "ลงชื่อ"]

// "ช่างยนต์ ช่างยนต์/1 2568 (ช.68A1)" → "ช่างยนต์"
// Stops at the first word that contains "/" or is a 4-digit year or starts with "("
function extractDeptName(raw: string): string {
  const words = raw.trim().split(/\s+/)
  const out: string[] = []
  for (const w of words) {
    if (w.includes("/") || /^\d{4}$/.test(w) || w.startsWith("(")) break
    out.push(w)
  }
  return out.join(" ").trim() || raw.trim()
}

// Scan all cells in header rows; return best department candidate.
function detectDepartmentFromHeaders(rows: string[][], firstStudentIdx: number): string {
  // Priority 1: cell starts with a known department keyword
  for (let i = 0; i < firstStudentIdx; i++) {
    for (const cell of rows[i]) {
      const v = cell.trim()
      if (DEPT_KEYWORDS.some(k => v.startsWith(k))) return extractDeptName(v)
    }
  }
  // Priority 2: cell contains "/" — likely "DeptName/class year (...)"
  for (let i = 0; i < firstStudentIdx; i++) {
    for (const cell of rows[i]) {
      const v = cell.trim()
      if (v && v.includes("/") && !v.startsWith("http")) return extractDeptName(v)
    }
  }
  // Priority 3: any non-empty Thai cell that isn't a title/header word
  for (let i = 0; i < firstStudentIdx; i++) {
    for (const cell of rows[i]) {
      const v = cell.trim()
      if (v &&
          !/^\d+$/.test(v) &&
          !/^ปวช|^ปวส/.test(v) &&
          !TITLE_SKIP.some(k => v.includes(k))) {
        return extractDeptName(v)
      }
    }
  }
  return "ไม่ระบุ"
}

// Format A: col[0]=studentId, col[1]=prefix+firstName, col[2]=lastName, col[4]=yearLevel
//   Department comes from a header row before the first student row
// Format B: col[0]=rowNum,  col[1]=studentId, col[2]=firstName, col[3]=lastName, col[4]=dept
function parseRows(rows: string[][], overrideDepartment?: string): {
  students: StudentRow[]
  errors: { row: number; error: string; data: string[] }[]
} {
  const students: StudentRow[] = []
  const errors: { row: number; error: string; data: string[] }[] = []

  // Detect format by scanning first 30 rows
  let formatA = false
  let firstStudentIdx = -1
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i]
    if (/^\d{8,11}$/.test(String(row[0] ?? "").trim())) {
      formatA = true
      firstStudentIdx = i
      break
    }
    if (/^\d{8,11}$/.test(String(row[1] ?? "").trim())) {
      firstStudentIdx = i
      break
    }
  }

  // Extract department and level (ปวช/ปวส) from header rows
  const defaultDepartment = overrideDepartment ||
    (firstStudentIdx > 0
      ? detectDepartmentFromHeaders(rows, firstStudentIdx)
      : "ไม่ระบุ")

  const detectedLevel = firstStudentIdx > 0
    ? detectLevelFromHeaders(rows, firstStudentIdx)
    : null

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const possibleId = formatA
      ? String(row[0] ?? "").trim()
      : String(row[1] ?? "").trim()

    if (!/^\d{8,11}$/.test(possibleId)) continue

    try {
      const studentId = possibleId
      let prefix: string, firstName: string, lastName: string, department: string, year: number

      if (formatA) {
        // col[0]=studentId, col[1]=prefix+firstName, col[2]=lastName, col[4]=yearLevel
        ;({ prefix, firstName } = extractPrefixAndName(String(row[1] ?? "")))
        lastName = String(row[2] ?? "").trim()
        department = defaultDepartment
        year = parseYearLevel(String(row[4] ?? "")) ?? calculateYear(studentId, detectedLevel)
      } else {
        // col[0]=rowNum, col[1]=studentId, col[2]=prefix+firstName, col[3]=lastName
        ;({ prefix, firstName } = extractPrefixAndName(String(row[2] ?? "")))
        lastName = String(row[3] ?? "").trim()
        department = defaultDepartment
        year = calculateYear(studentId, detectedLevel)
      }

      if (!firstName) throw new Error("ชื่อหายไป")
      if (!lastName) throw new Error("นามสกุลหายไป")

      students.push({ studentId, prefix, firstName, lastName, department, year })
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
      errors.push({ row: i + 1, error: msg, data: row.map(String) })
    }
  }

  return { students, errors }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const mode = formData.get("mode") as string
    const overrideDepartment = (formData.get("department") as string | null)?.trim() || undefined

    if (!file) return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 })

    const fileName = file.name.toLowerCase()
    const buf = Buffer.from(await file.arrayBuffer())
    let rows: string[][]

    if (fileName.endsWith(".xlsx")) {
      // XLSX is always stored as UTF-8 XML inside the ZIP
      const workbook = XLSX.read(buf, { type: "buffer" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" }) as string[][]
    } else if (fileName.endsWith(".xls")) {
      // Legacy XLS — try XLSX library with CP874 first
      const workbook = XLSX.read(buf, { type: "buffer", codepage: 874 })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const xlsRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" }) as string[][]

      if (hasReplacementChars(xlsRows)) {
        // XLSX produced U+FFFD — file is likely a CP874 CSV/TSV renamed as .xls
        rows = bufferToRows(buf)
      } else {
        // XLSX may have decoded as Latin-1; apply per-cell fix
        rows = xlsRows.map(row => row.map(cell => fixThaiEncoding(String(cell))))
      }
    } else {
      // CSV / TSV — detect encoding from raw bytes
      rows = bufferToRows(buf)
    }

    console.log("[import] file:", file.name, "size:", file.size, "rows:", rows.length)
    const firstStudentRow = rows.find(row =>
      /^\d{8,11}$/.test(String(row[0] ?? "").trim()) ||
      /^\d{8,11}$/.test(String(row[1] ?? "").trim())
    )
    if (firstStudentRow) {
      console.log("[import] first student row:")
      firstStudentRow.forEach((v, i) => { if (String(v).trim()) console.log(`  col[${i}] = "${v}"`) })
    } else {
      console.log("[import] ⚠ no student row found in first 30 rows")
      console.log("[import] row[0]:", JSON.stringify(rows[0]))
      console.log("[import] row[1]:", JSON.stringify(rows[1]))
    }

    const { students, errors } = parseRows(rows, overrideDepartment)
    console.log("[import] parsed:", students.length, "errors:", errors.length)
    if (students.length > 0) console.log("[import] sample:", JSON.stringify(students[0]))
    if (errors.length > 0) console.log("[import] first error:", JSON.stringify(errors[0]))

    if (mode === "preview") {
      return NextResponse.json({
        preview: students.slice(0, 10),
        total: students.length,
        errors: errors.slice(0, 5),
      })
    }

    // MODE: IMPORT
    const results = {
      success: [] as StudentRow[],
      errors: [...errors] as { row: number; error: string; data: unknown }[],
      summary: { total: students.length, success: 0, failed: errors.length },
    }

    for (const student of students) {
      try {
        const existing = await prisma.student.findUnique({ where: { studentId: student.studentId } })
        if (existing) {
          results.errors.push({ row: 0, error: `รหัส ${student.studentId} มีอยู่แล้ว`, data: student })
          results.summary.failed++
          continue
        }

        const hashedPassword = await bcrypt.hash(student.studentId, 10)
        const yearString = YEAR_MAP[student.year] ?? `ปีที่ ${student.year}`

        await prisma.student.create({
          data: {
            studentId: student.studentId,
            prefix: student.prefix || "นาย",
            password: hashedPassword,
            firstName: student.firstName,
            lastName: student.lastName,
            department: student.department,
            year: yearString,
            isActive: true,
            isFirstLogin: true,
          },
        })

        results.success.push(student)
        results.summary.success++
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
        results.errors.push({ row: 0, error: msg, data: student })
        results.summary.failed++
      }
    }

    return NextResponse.json(results)
  } catch (error: unknown) {
    console.error("Import error:", error)
    const msg = error instanceof Error ? error.message : "Internal error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
