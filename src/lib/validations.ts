import { z } from "zod"
import { ActivityCategory, ActivityStatus, AdminRole } from "@/generated/prisma"

export const loginSchema = z.object({
  studentId: z.string().length(11, "รหัสนักศึกษาต้องมี 11 หลัก").regex(/^\d{11}$/, "รหัสนักศึกษาต้องเป็นตัวเลขเท่านั้น"),
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"),
})

export const adminLoginSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
})

export const activitySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกิจกรรม"),
  description: z.string().optional(),
  category: z.nativeEnum(ActivityCategory),
  targetYear: z.string().min(1, "กรุณาเลือกระดับชั้น"),
  targetSemester: z.string().min(1, "กรุณาเลือกภาคเรียน"),
  targetDepartments: z.array(z.string()),
  startDate: z.string().min(1, "กรุณาเลือกวันเริ่มต้น"),
  endDate: z.string().min(1, "กรุณาเลือกวันสิ้นสุด"),
  location: z.string().optional(),
  maxSlots: z.number().int().positive().optional(),
  status: z.nativeEnum(ActivityStatus),
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: z.string().min(4, "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "รหัสผ่านใหม่ต้องไม่เหมือนรหัสผ่านเดิม",
    path: ["newPassword"],
  })

export const joinSchema = z.object({
  code: z.string().length(6, "รหัสต้องมี 6 ตัวอักษร").regex(/^[A-Z0-9]{6}$/i, "รหัสต้องเป็นตัวอักษรหรือตัวเลขเท่านั้น"),
})

export const codeGenerateSchema = z.object({
  count: z.number().int().min(1, "ต้องการอย่างน้อย 1 รหัส").max(100, "สร้างได้สูงสุด 100 รหัส"),
})

export const departmentSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อแผนก"),
  aliases: z.array(z.string().min(1)).default([]),
})

export const adminAccountBaseSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร").optional(),
  name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  role: z.nativeEnum(AdminRole),
  departmentId: z.string().optional().nullable(),
})

export const adminAccountSchema = adminAccountBaseSchema.refine(
  (data) => data.role !== "TEACHER" || !!data.departmentId,
  { message: "กรุณาเลือกแผนกสำหรับอาจารย์", path: ["departmentId"] }
)

export const adminAccountUpdateSchema = adminAccountBaseSchema.partial().refine(
  (data) => data.role !== "TEACHER" || !!data.departmentId,
  { message: "กรุณาเลือกแผนกสำหรับอาจารย์", path: ["departmentId"] }
)

export const vocationalActivitySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกิจกรรม"),
  academicYear: z.string().length(4, "ปีการศึกษาต้องมี 4 หลัก").regex(/^\d{4}$/, "ปีการศึกษาต้องเป็นตัวเลขเท่านั้น"),
  semester: z.string().min(1, "กรุณาเลือกภาคเรียน"),
  targetYears: z.array(z.string()),
  passThreshold: z.number().min(0, "เกณฑ์ผ่านต้องอยู่ระหว่าง 0-100").max(100, "เกณฑ์ผ่านต้องอยู่ระหว่าง 0-100"),
  departmentIds: z.array(z.string()).min(1, "กรุณาเลือกอย่างน้อย 1 แผนก"),
})

export const bulkVocationalScoreSchema = z.object({
  scores: z
    .array(
      z.object({
        studentId: z.string().min(1),
        score: z.number().min(0, "คะแนนต้องอยู่ระหว่าง 0-100").max(100, "คะแนนต้องอยู่ระหว่าง 0-100"),
      })
    )
    .min(1, "ไม่มีคะแนนให้บันทึก"),
})

export const gradeBulkScoreSchema = z.object({
  entries: z
    .array(
      z.object({
        activityId: z.string().min(1),
        studentId: z.string().min(1),
        score: z.number().min(0, "คะแนนต้องอยู่ระหว่าง 0-100").max(100, "คะแนนต้องอยู่ระหว่าง 0-100"),
      })
    )
    .min(1, "ไม่มีคะแนนให้บันทึก"),
  isDraft: z.boolean(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type AdminLoginInput = z.infer<typeof adminLoginSchema>
export type ActivityInput = z.infer<typeof activitySchema>
export type PasswordInput = z.infer<typeof passwordSchema>
export type JoinInput = z.infer<typeof joinSchema>
export type CodeGenerateInput = z.infer<typeof codeGenerateSchema>
export type DepartmentInput = z.infer<typeof departmentSchema>
export type AdminAccountInput = z.infer<typeof adminAccountSchema>
export type VocationalActivityInput = z.infer<typeof vocationalActivitySchema>
export type BulkVocationalScoreInput = z.infer<typeof bulkVocationalScoreSchema>
export type GradeBulkScoreInput = z.infer<typeof gradeBulkScoreSchema>
