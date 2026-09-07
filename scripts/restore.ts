import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import fs from "fs"

// Restores rows from a backup.ts JSON file via upsert (by primary key).
// This only creates missing rows and updates existing ones — it NEVER deletes
// anything, so it's safe to run even if the database already has newer data.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function withDates<T extends Record<string, unknown>>(row: T, dateFields: string[]): T {
  const copy = { ...row }
  for (const field of dateFields) {
    if (copy[field]) (copy as Record<string, unknown>)[field] = new Date(copy[field] as string)
  }
  return copy
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error("Usage: npm run restore -- <path-to-backup.json>")
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, "utf-8"))
  let count = 0

  for (const d of raw.departments ?? []) {
    const row = withDates(d, ["createdAt", "updatedAt"])
    await prisma.department.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }
  for (const a of raw.admins ?? []) {
    const row = withDates(a, ["createdAt", "updatedAt"])
    await prisma.admin.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }
  for (const s of raw.students ?? []) {
    const row = withDates(s, ["createdAt", "updatedAt"])
    await prisma.student.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }
  for (const a of raw.activities ?? []) {
    const row = withDates(a, ["startDate", "endDate", "deletedAt", "createdAt", "updatedAt"])
    await prisma.activity.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }
  for (const c of raw.activityCodes ?? []) {
    const row = withDates(c, ["usedAt", "createdAt"])
    await prisma.activityCode.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }
  for (const p of raw.participations ?? []) {
    const row = withDates(p, ["joinedAt"])
    await prisma.participation.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }
  for (const v of raw.vocationalActivities ?? []) {
    const { departments, ...scalarFields } = v as { departments?: { id: string }[] } & Record<string, unknown>
    const row = withDates(scalarFields, ["createdAt", "updatedAt"])
    const deptIds = (departments ?? []).map((d) => ({ id: d.id }))
    await prisma.vocationalActivity.upsert({
      where: { id: row.id as string },
      update: { ...row, departments: { set: deptIds } },
      create: { ...row, departments: { connect: deptIds } } as never,
    })
    count++
  }
  for (const v of raw.vocationalActivityScores ?? []) {
    const row = withDates(v, ["createdAt", "updatedAt"])
    await prisma.vocationalActivityScore.upsert({ where: { id: row.id }, update: row, create: row })
    count++
  }

  console.log(`✓ Restore complete — ${count} rows upserted (nothing was deleted)`)
}

main()
  .catch((err) => {
    console.error("Restore failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
