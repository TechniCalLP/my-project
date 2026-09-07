import { PrismaClient, AdminRole } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { DEPARTMENTS } from "../src/lib/constants"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// NOTE: this script only upserts safe, idempotent baseline data (departments, the
// bootstrap SUPER_ADMIN account). It must never delete or recreate Student/Activity/
// ActivityCode/Participation rows — this runs against the real shared database, not
// a disposable local one.
async function main() {
  // Departments
  const departments = await Promise.all(
    DEPARTMENTS.map((name) =>
      prisma.department.upsert({ where: { name }, update: {}, create: { name } })
    )
  )
  console.log(`✓ Upserted ${departments.length} departments`)

  // Admin (SuperAdmin)
  const adminPassword = await bcrypt.hash("admin1234", 10)
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { role: AdminRole.SUPER_ADMIN },
    create: { username: "admin", password: adminPassword, name: "ผู้ดูแลระบบ", role: AdminRole.SUPER_ADMIN },
  })
  console.log("✓ Ensured bootstrap admin account is SUPER_ADMIN")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
