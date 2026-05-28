const TH_TZ = "Asia/Bangkok"

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

// "27 พฤษภาคม 2568"
export function formatThaiDate(date: Date | string): string {
  const d = new Date(date)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TH_TZ,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d)
  const day = Number(parts.find(p => p.type === "day")?.value)
  const month = Number(parts.find(p => p.type === "month")?.value)
  const year = Number(parts.find(p => p.type === "year")?.value)
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`
}

// "27 พฤษภาคม 2568 10:30"
export function formatThaiDateTime(date: Date | string): string {
  const d = new Date(date)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TH_TZ,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const day = Number(parts.find(p => p.type === "day")?.value)
  const month = Number(parts.find(p => p.type === "month")?.value)
  const year = Number(parts.find(p => p.type === "year")?.value)
  const hour = parts.find(p => p.type === "hour")?.value ?? "00"
  const minute = parts.find(p => p.type === "minute")?.value ?? "00"
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543} ${hour}:${minute}`
}
