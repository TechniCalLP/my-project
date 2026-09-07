import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import fs from "fs"
import path from "path"

// Read-only export of every table to a timestamped JSON file under /backups.
// Never deletes or modifies anything in the database.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const [departments, admins, students, activities, activityCodes, participations, vocationalActivities, vocationalActivityScores] =
    await Promise.all([
      prisma.department.findMany(),
      prisma.admin.findMany(),
      prisma.student.findMany(),
      prisma.activity.findMany(),
      prisma.activityCode.findMany(),
      prisma.participation.findMany(),
      prisma.vocationalActivity.findMany({ include: { departments: { select: { id: true } } } }),
      prisma.vocationalActivityScore.findMany(),
    ])

  const backup = {
    createdAt: new Date().toISOString(),
    departments,
    admins,
    students,
    activities,
    activityCodes,
    participations,
    vocationalActivities,
    vocationalActivityScores,
  }

  const dir = path.join(__dirname, "..", "backups")
  fs.mkdirSync(dir, { recursive: true })
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf-8")

  console.log(`✓ Backup written to ${filepath}`)
  console.log(`  Departments      : ${departments.length}`)
  console.log(`  Admins           : ${admins.length}`)
  console.log(`  Students         : ${students.length}`)
  console.log(`  Activities       : ${activities.length}`)
  console.log(`  ActivityCodes    : ${activityCodes.length}`)
  console.log(`  Participations   : ${participations.length}`)
  console.log(`  VocationalActivities      : ${vocationalActivities.length}`)
  console.log(`  VocationalActivityScores  : ${vocationalActivityScores.length}`)
}

main()
  .catch((err) => {
    console.error("Backup failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
