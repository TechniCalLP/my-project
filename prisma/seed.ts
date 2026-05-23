import { PrismaClient, ActivityCategory, ActivityStatus } from "../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Admin
  const adminPassword = await bcrypt.hash("admin1234", 10)
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: adminPassword, name: "ผู้ดูแลระบบ" },
  })

  // Students
  const studentPassword = await bcrypt.hash("1234", 10)
  const studentRows = [
    { studentId: "68301010016", prefix: "นาย",    firstName: "ทดสอบ",    lastName: "ระบบ",      year: "ปวช.1", department: "เทคนิคคอมพิวเตอร์" },
    { studentId: "68301010001", prefix: "นาย",    firstName: "สมชาย",    lastName: "ใจดี",      year: "ปวช.1", department: "เทคนิคคอมพิวเตอร์" },
    { studentId: "68301010002", prefix: "นางสาว", firstName: "สมหญิง",   lastName: "รักเรียน",  year: "ปวช.1", department: "เทคนิคคอมพิวเตอร์" },
    { studentId: "68301010003", prefix: "นาย",    firstName: "วิชัย",    lastName: "มานะ",      year: "ปวช.1", department: "ไฟฟ้ากำลัง" },
    { studentId: "68301020001", prefix: "นางสาว", firstName: "มาลี",     lastName: "สุขใจ",     year: "ปวช.2", department: "เทคนิคคอมพิวเตอร์" },
    { studentId: "68301020002", prefix: "นาย",    firstName: "ประเสริฐ", lastName: "ดีงาม",     year: "ปวช.2", department: "ช่างกล" },
    { studentId: "68301030001", prefix: "นาย",    firstName: "กิตติ",    lastName: "เก่งกาจ",   year: "ปวช.3", department: "เทคนิคคอมพิวเตอร์" },
    { studentId: "68401010001", prefix: "นางสาว", firstName: "นารี",     lastName: "ฉลาด",      year: "ปวส.1", department: "เทคโนโลยีสารสนเทศ" },
    { studentId: "68401010002", prefix: "นาย",    firstName: "อนุชา",    lastName: "ขยัน",      year: "ปวส.1", department: "เทคโนโลยีสารสนเทศ" },
    { studentId: "68401020001", prefix: "นาย",    firstName: "ธนา",      lastName: "มั่งมี",    year: "ปวส.2", department: "เทคโนโลยีสารสนเทศ" },
  ]

  const students = await Promise.all(
    studentRows.map((row) =>
      prisma.student.upsert({
        where: { studentId: row.studentId },
        update: {},
        create: { ...row, password: studentPassword, isFirstLogin: true },
      })
    )
  )
  console.log(`✓ Upserted ${students.length} students`)

  // Clear dependent data so activities can be re-created cleanly
  await prisma.participation.deleteMany({})
  await prisma.activityCode.deleteMany({})
  await prisma.activity.deleteMany({})

  const makeDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day)

  type ActivityRow = {
    name: string
    category: ActivityCategory
    targetYear: string
    targetSemester: string
    startDate: Date
    endDate: Date
    status: ActivityStatus
  }

  const activitiesData: ActivityRow[] = [
    // ปวช.1 ภาคเรียนที่ 1
    { name: "ปฐมนิเทศ",        category: ActivityCategory.ACADEMIC,          targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 5, 15),  endDate: makeDate(2024, 5, 15),  status: ActivityStatus.COMPLETED },
    { name: "อบรมคุณธรรม",     category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 10),  endDate: makeDate(2024, 6, 10),  status: ActivityStatus.COMPLETED },
    { name: "ไหว้ครู",          category: ActivityCategory.ACADEMIC,          targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 20),  endDate: makeDate(2024, 6, 20),  status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5),   endDate: makeDate(2024, 7, 5),   status: ActivityStatus.COMPLETED },
    // ปวช.1 ภาคเรียนที่ 2
    { name: "ลูกเสือฯวิทยาลัยเทคนิคลำปาง", category: ActivityCategory.SCOUT, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2024, 11, 15), endDate: makeDate(2024, 11, 17), status: ActivityStatus.ACTIVE },
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10),  endDate: makeDate(2025, 1, 10),  status: ActivityStatus.ACTIVE },
    // ปวช.2 ภาคเรียนที่ 1
    { name: "เลือกตั้งอวท.",   category: ActivityCategory.ACADEMIC,          targetYear: "ปวช.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 25),  endDate: makeDate(2024, 6, 25),  status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวช.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5),   endDate: makeDate(2024, 7, 5),   status: ActivityStatus.COMPLETED },
    // ปวช.2 ภาคเรียนที่ 2
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวช.2", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10),  endDate: makeDate(2025, 1, 10),  status: ActivityStatus.ACTIVE },
    // ปวช.3 ภาคเรียนที่ 1
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวช.3", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5),   endDate: makeDate(2024, 7, 5),   status: ActivityStatus.COMPLETED },
    // ปวช.3 ภาคเรียนที่ 2
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวช.3", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10),  endDate: makeDate(2025, 1, 10),  status: ActivityStatus.ACTIVE },
    { name: "ปัจฉิมนิเทศ",     category: ActivityCategory.ACADEMIC,          targetYear: "ปวช.3", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 2, 20),  endDate: makeDate(2025, 2, 20),  status: ActivityStatus.ACTIVE },
    // ปวส.1 ภาคเรียนที่ 1
    { name: "ปฐมนิเทศ",        category: ActivityCategory.ACADEMIC,          targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 5, 15),  endDate: makeDate(2024, 5, 15),  status: ActivityStatus.COMPLETED },
    { name: "อบรมคุณธรรม",     category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 10),  endDate: makeDate(2024, 6, 10),  status: ActivityStatus.COMPLETED },
    { name: "อวท.จิตอาสา",     category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 8, 10),  endDate: makeDate(2024, 8, 10),  status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5),   endDate: makeDate(2024, 7, 5),   status: ActivityStatus.COMPLETED },
    // ปวส.1 ภาคเรียนที่ 2
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10),  endDate: makeDate(2025, 1, 10),  status: ActivityStatus.ACTIVE },
    // ปวส.2 ภาคเรียนที่ 1
    { name: "ถวายเทียนฯ",      category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 20),  endDate: makeDate(2024, 7, 20),  status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5),   endDate: makeDate(2024, 7, 5),   status: ActivityStatus.COMPLETED },
    // ปวส.2 ภาคเรียนที่ 2
    { name: "ส่งท้ายปีเก่า",   category: ActivityCategory.ACADEMIC,          targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2024, 12, 27), endDate: makeDate(2024, 12, 27), status: ActivityStatus.ACTIVE },
    { name: "ตรวจสุขภาพ",      category: ActivityCategory.HEALTH,            targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10),  endDate: makeDate(2025, 1, 10),  status: ActivityStatus.ACTIVE },
  ]

  const createdActivities: { id: string; targetYear: string }[] = []
  for (const row of activitiesData) {
    const act = await prisma.activity.create({ data: { ...row, adminId: admin.id } })
    createdActivities.push({ id: act.id, targetYear: act.targetYear })
  }
  console.log(`✓ Created ${createdActivities.length} activities`)

  // 5 codes per activity so every student in that year can get a unique code
  let codeCounter = 100000
  const codesByActivity: Record<string, string[]> = {}
  const allCodesData: { code: string; activityId: string }[] = []
  for (const act of createdActivities) {
    codesByActivity[act.id] = []
    for (let i = 0; i < 5; i++) {
      const code = String(codeCounter++)
      codesByActivity[act.id].push(code)
      allCodesData.push({ code, activityId: act.id })
    }
  }
  await prisma.activityCode.createMany({ data: allCodesData, skipDuplicates: true })
  console.log(`✓ Created ${allCodesData.length} activity codes`)

  // Each student joins all activities that target their year
  let participationCount = 0
  for (const student of students) {
    const matching = createdActivities.filter((a) => a.targetYear === student.year)
    for (const act of matching) {
      const code = codesByActivity[act.id].shift()
      if (!code) continue // no codes left (shouldn't happen with 5 per activity)

      await prisma.activityCode.update({
        where: { code },
        data: { isUsed: true, usedBy: student.studentId, usedAt: new Date() },
      })
      await prisma.participation.create({
        data: { studentId: student.id, activityId: act.id, codeUsed: code },
      })
      participationCount++
    }
  }
  console.log(`✓ Created ${participationCount} participations`)

  console.log("")
  console.log("Seed complete:")
  console.log(`  Admin      : 1  (admin / admin1234)`)
  console.log(`  Students   : ${students.length}  (password: 1234)`)
  console.log(`  Activities : ${createdActivities.length}`)
  console.log(`  Codes      : ${allCodesData.length}`)
  console.log(`  Joins      : ${participationCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
