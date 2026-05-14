"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { codeGenerateSchema, type CodeGenerateInput } from "@/lib/validations"

export function GenerateCodesForm({ activityId }: { activityId: string }) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CodeGenerateInput>({
    resolver: standardSchemaResolver(codeGenerateSchema),
    defaultValues: { count: 10 },
  })

  const onGenerate = async (data: CodeGenerateInput) => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/activities/${activityId}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: data.count }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "เกิดข้อผิดพลาด")
        return
      }

      const newCodes = await res.json()
      toast.success(`สร้าง ${newCodes.length} รหัสสำเร็จ`)
      reset()
      router.refresh()
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-thai">สร้างรหัสใหม่</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onGenerate)} className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="count" className="font-thai">จำนวนรหัส (1-100)</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              className="w-32"
              {...register("count", { valueAsNumber: true })}
              disabled={generating}
            />
            {errors.count && (
              <p className="text-sm text-red-500 font-thai">{errors.count.message}</p>
            )}
          </div>
          <Button type="submit" disabled={generating} className="font-thai">
            {generating ? "กำลังสร้าง..." : "สร้างรหัส"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
