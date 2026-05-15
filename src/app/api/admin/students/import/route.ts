import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import * as XLSX from "xlsx"

interface StudentRow {
  studentId: string
  firstName: string
  lastName: string
  department: string
  year: number
}

const YEAR_MAP: Record<number, string> = {
  1: "ปวช.1", 2: "ปวช.2", 3: "ปวช.3", 4: "ปวส.1", 5: "ปวส.2",
}

function calculateYear(studentId: string): number {
  const currentYear = new Date().getFullYear() + 543
  const yearPrefix = parseInt(studentId.substring(0, 2))
  const enrollYear = 2500 + yearPrefix
  const year = currentYear - enrollYear + 1
  return Math.max(1, Math.min(4, year))
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0]
  const commaCount = (firstLine.match(/,/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length
  return tabCount > commaCount ? "\t" : ","
}

// XLS files store Thai text as CP874 bytes but XLSX reads them as UTF-8.
// Fix: re-encode garbled string as UTF-8 bytes (which are the original CP874 bytes), then decode as windows-874.
// NOTE: bytes that were invalid standalone UTF-8 continuation chars are irrecoverable and remain as "?"
function fixThaiEncoding(garbled: string): string {
  try {
    const bytes = Buffer.from(garbled, "utf8")
    return new TextDecoder("windows-874").decode(bytes)
  } catch {
    return garbled
  }
}

function parseRows(rows: string[][]): { students: StudentRow[]; errors: { row: number; error: string; data: string[] }[] } {
  const students: StudentRow[] = []
  const errors: { row: number; error: string; data: string[] }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    // Auto-detect student rows: column B (index 1) must be numeric 8-11 digits
    const possibleId = String(row[1] ?? "").trim()
    if (!/^\d{8,11}$/.test(possibleId)) continue

    try {
      const studentId = possibleId
      const firstName = fixThaiEncoding(String(row[2] ?? "").trim())
      const lastName  = fixThaiEncoding(String(row[3] ?? "").trim())
      const department = fixThaiEncoding(String(row[4] ?? "").trim()) || "ไม่ระบุ"

      if (!firstName) throw new Error("ชื่อหายไป")
      if (!lastName)  throw new Error("นามสกุลหายไป")

      const year = calculateYear(studentId)
      students.push({ studentId, firstName, lastName, department, year })

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

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let rows: string[][]

    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: "buffer", codepage: 874 })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" })
    } else {
      const text = (await file.text()).replace(/^﻿/, "")
      const delimiter = detectDelimiter(text)
      rows = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map(line => line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, "")))
    }

    // DEBUG: log all non-empty columns in first student row
    console.log("[import] file:", file.name, "size:", file.size, "total rows:", rows.length)
    const firstStudentRow = rows.find(row => /^\d{8,11}$/.test(String(row[1] ?? "").trim()))
    if (firstStudentRow) {
      console.log("[import] first student row columns:")
      firstStudentRow.forEach((v, i) => { if (String(v).trim()) console.log(`  col[${i}] = "${v}"`) })
    } else {
      console.log("[import] no student row found!")
    }

    const { students, errors } = parseRows(rows)
    console.log("[import] parsed students:", students.length, "errors:", errors.length)
    if (students.length > 0) {
      console.log("[import] sample:", JSON.stringify(students[0]))
    }
    if (errors.length > 0) {
      console.log("[import] first error:", JSON.stringify(errors[0]))
    }

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
      summary: {
        total: students.length,
        success: 0,
        failed: errors.length,
      },
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
            prefix: "นาย",
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
