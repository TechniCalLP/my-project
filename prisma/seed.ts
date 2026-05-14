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
    create: {
      username: "admin",
      password: adminPassword,
      name: "ผู้ดูแลระบบ"
    }
  })

  // Sample student
  const studentPassword = await bcrypt.hash("1234", 10)
  await prisma.student.upsert({
    where: { studentId: "68301010016" },
    update: {},
    create: {
      studentId: "68301010016",
      prefix: "นาย",
      firstName: "ทดสอบ",
      lastName: "ระบบ",
      year: "ปวช.1",
      department: "เทคนิคคอมพิวเตอร์",
      password: studentPassword,
      isFirstLogin: true
    }
  })

  const now = new Date()
  const makeDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day)

  const activities: {
    name: string
    category: ActivityCategory
    targetYear: string
    targetSemester: string
    startDate: Date
    endDate: Date
    status: ActivityStatus
  }[] = [
    // ปวช.1 ภาคเรียนที่ 1
    { name: "ปฐมนิเทศ", category: ActivityCategory.ACADEMIC, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 5, 15), endDate: makeDate(2024, 5, 15), status: ActivityStatus.COMPLETED },
    { name: "อบรมคุณธรรม", category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 10), endDate: makeDate(2024, 6, 10), status: ActivityStatus.COMPLETED },
    { name: "ไหว้ครู", category: ActivityCategory.ACADEMIC, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 20), endDate: makeDate(2024, 6, 20), status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5), endDate: makeDate(2024, 7, 5), status: ActivityStatus.COMPLETED },

    // ปวช.1 ภาคเรียนที่ 2
    { name: "ลูกเสือฯวิทยาลัยเทคนิคลำปาง", category: ActivityCategory.SCOUT, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2024, 11, 15), endDate: makeDate(2024, 11, 17), status: ActivityStatus.ACTIVE },
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวช.1", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10), endDate: makeDate(2025, 1, 10), status: ActivityStatus.ACTIVE },

    // ปวช.2 ภาคเรียนที่ 1
    { name: "เลือกตั้งอวท.", category: ActivityCategory.ACADEMIC, targetYear: "ปวช.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 25), endDate: makeDate(2024, 6, 25), status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวช.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5), endDate: makeDate(2024, 7, 5), status: ActivityStatus.COMPLETED },

    // ปวช.2 ภาคเรียนที่ 2
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวช.2", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10), endDate: makeDate(2025, 1, 10), status: ActivityStatus.ACTIVE },

    // ปวช.3 ภาคเรียนที่ 1
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวช.3", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5), endDate: makeDate(2024, 7, 5), status: ActivityStatus.COMPLETED },

    // ปวช.3 ภาคเรียนที่ 2
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวช.3", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10), endDate: makeDate(2025, 1, 10), status: ActivityStatus.ACTIVE },
    { name: "ปัจฉิมนิเทศ", category: ActivityCategory.ACADEMIC, targetYear: "ปวช.3", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 2, 20), endDate: makeDate(2025, 2, 20), status: ActivityStatus.ACTIVE },

    // ปวส.1 ภาคเรียนที่ 1
    { name: "อบรมคุณธรรม", category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 6, 10), endDate: makeDate(2024, 6, 10), status: ActivityStatus.COMPLETED },
    { name: "ปฐมนิเทศ", category: ActivityCategory.ACADEMIC, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 5, 15), endDate: makeDate(2024, 5, 15), status: ActivityStatus.COMPLETED },
    { name: "อวท.จิตอาสา", category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 8, 10), endDate: makeDate(2024, 8, 10), status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5), endDate: makeDate(2024, 7, 5), status: ActivityStatus.COMPLETED },

    // ปวส.1 ภาคเรียนที่ 2
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวส.1", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10), endDate: makeDate(2025, 1, 10), status: ActivityStatus.ACTIVE },

    // ปวส.2 ภาคเรียนที่ 1
    { name: "ถวายเทียนฯ", category: ActivityCategory.COMMUNITY_SERVICE, targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 20), endDate: makeDate(2024, 7, 20), status: ActivityStatus.COMPLETED },
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 1", startDate: makeDate(2024, 7, 5), endDate: makeDate(2024, 7, 5), status: ActivityStatus.COMPLETED },

    // ปวส.2 ภาคเรียนที่ 2
    { name: "ส่งท้ายปีเก่า", category: ActivityCategory.ACADEMIC, targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2024, 12, 27), endDate: makeDate(2024, 12, 27), status: ActivityStatus.ACTIVE },
    { name: "ตรวจสุขภาพ", category: ActivityCategory.HEALTH, targetYear: "ปวส.2", targetSemester: "ภาคเรียนที่ 2", startDate: makeDate(2025, 1, 10), endDate: makeDate(2025, 1, 10), status: ActivityStatus.ACTIVE },
  ]

  const createdActivityIds: string[] = []
  for (const activity of activities) {
    const created = await prisma.activity.create({
      data: { ...activity, adminId: admin.id }
    })
    createdActivityIds.push(created.id)
  }

  await prisma.activityCode.createMany({
    data: createdActivityIds.map((activityId, i) => ({
      code: String(100000 + i + 1),
      activityId,
      isUsed: false,
    })),
    skipDuplicates: true,
  })

  console.log(`Seeded ${activities.length} activities, ${createdActivityIds.length} codes, 1 admin, 1 student`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
