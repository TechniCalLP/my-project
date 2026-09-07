import { PrismaClient } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const students = await prisma.student.findMany({
    where: { isActive: true, department: "เทคโนโลยีสารสนเทศ", year: "ปวช.1" },
    select: { studentId: true, prefix: true, firstName: true, lastName: true, group: true },
    orderBy: [{ group: "asc" }, { studentId: "asc" }],
  })
  console.log(`Total: ${students.length}\n`)
  for (const s of students) {
    console.log(`${s.studentId}\tกลุ่ม ${s.group ?? "-"}\t${s.prefix}${s.firstName} ${s.lastName}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
