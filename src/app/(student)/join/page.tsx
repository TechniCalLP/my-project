"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_NAMES } from "@/lib/constants"
import { ActivityCategory } from "@/generated/prisma"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  ACADEMIC: "bg-purple-100 text-purple-700",
  COMMUNITY_SERVICE: "bg-success/10 text-success",
  HEALTH: "bg-red-100 text-red-700",
  SCOUT: "bg-yellow-100 text-yellow-700",
}

interface RecentActivity {
  id: string
  name: string
  category: ActivityCategory
  joinedAt: string
}

export default function JoinPage() {
  const router = useRouter()
  const [digits, setDigits] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<RecentActivity[]>([])
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentJoined")
      if (stored) setRecent(JSON.parse(stored))
    } catch {}
  }, [])

  const handleChange = (i: number, val: string) => {
    if (!/^[A-Za-z0-9]?$/.test(val)) return
    const next = [...digits]
    next[i] = val.toUpperCase()
    setDigits(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()
    const next = [...digits]
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j]
    setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const code = digits.join("")
  const isComplete = code.length === 6

  const handleSubmit = async () => {
    if (!isComplete || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? "เกิดข้อผิดพลาด")
        return
      }

      const entry: RecentActivity = {
        id: json.activity.id,
        name: json.activity.name,
        category: json.activity.category,
        joinedAt: new Date().toISOString(),
      }
      const updated = [entry, ...recent].slice(0, 5)
      setRecent(updated)
      localStorage.setItem("recentJoined", JSON.stringify(updated))

      toast.success(`เข้าร่วมกิจกรรม "${json.activity.name}" สำเร็จ!`)
      setDigits(["", "", "", "", "", ""])
      setTimeout(() => router.push("/history"), 1500)
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-thai">เข้าร่วมกิจกรรมด้วยรหัส</h1>
        <p className="text-sm text-gray-500 font-thai mt-1">
          กรอกรหัสกิจกรรม 6 ตัวที่ได้รับจากครู
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai text-center">กรอกรหัสกิจกรรม 6 ตัว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2 md:gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={cn(
                  "w-11 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 rounded-xl transition-colors outline-none",
                  d
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                )}
              />
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isComplete || loading}
            className="w-full h-12 font-thai text-base"
          >
            {loading ? "กำลังตรวจสอบ..." : "ยืนยันการเข้าร่วม"}
          </Button>

          <p className="text-xs text-center text-gray-400 font-thai">
            วางรหัสได้เลย (Ctrl+V) ระบบจะกรอกให้อัตโนมัติ (เช่น ACT001, HLT001)
          </p>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-thai text-base">กิจกรรมที่เข้าร่วมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.map((a) => (
                <div key={a.id + a.joinedAt} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <p className="flex-1 font-medium font-thai text-sm min-w-0 truncate">{a.name}</p>
                  <Badge className={`${CATEGORY_COLORS[a.category]} border-0 font-thai text-xs shrink-0`}>
                    {CATEGORY_NAMES[a.category]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
