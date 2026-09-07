export const DEPARTMENTS = [
  "ช่างยนต์", "ช่างกลโรงงาน", "ช่างเชื่อมโลหะ", "ช่างไฟฟ้า",
  "อิเล็กทรอนิกส์", "ช่างก่อสร้าง", "สถาปัตยกรรม", "โยธา",
  "เมคคาทรอนิกส์และหุ่นยนต์", "เทคโนโลยีสารสนเทศ", "เทคนิคคอมพิวเตอร์"
] as const

export const YEARS = ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"] as const
export const SEMESTERS = ["ภาคเรียนที่ 1", "ภาคเรียนที่ 2"] as const
export const PREFIXES = ["นาย", "นาง", "นางสาว"] as const

export const CATEGORY_NAMES = {
  ACADEMIC: "วิชาการ",
  COMMUNITY_SERVICE: "บำเพ็ญประโยชน์",
  HEALTH: "สุขภาพ",
  SCOUT: "ลูกเสือ"
} as const

export const ADMIN_ROLE_NAMES = {
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด",
  ADMIN: "ผู้ดูแลระบบ",
  TEACHER: "อาจารย์",
} as const

const CURRENT_BE_YEAR = new Date().getFullYear() + 543
export const ACADEMIC_YEARS = [CURRENT_BE_YEAR, CURRENT_BE_YEAR - 1, CURRENT_BE_YEAR - 2].map(String)

export const DEFAULT_VOCATIONAL_PASS_THRESHOLD = 60
