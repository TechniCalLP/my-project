"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityForm } from "@/components/forms/activity-form"

export default function NewActivityPage() {
  const router = useRouter()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-thai mb-6">สร้างกิจกรรมใหม่</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลกิจกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm onSuccess={() => router.push("/admin/activities")} />
        </CardContent>
      </Card>
    </div>
  )
}
