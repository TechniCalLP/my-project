"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityForm } from "@/components/forms/activity-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditActivityPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [activity, setActivity] = useState<Parameters<typeof ActivityForm>[0]["activity"]>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/activities/${params.id}`)
      .then((res) => {
        if (!res.ok) { router.push("/admin/activities"); return null }
        return res.json()
      })
      .then((data) => { if (data) setActivity(data) })
      .finally(() => setLoading(false))
  }, [params.id])

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/admin/activities/${params.id}`} className="text-sm text-gray-500 hover:text-gray-700 font-thai">
          ← กลับ
        </Link>
        <h1 className="text-2xl font-bold font-thai mt-1">แก้ไขกิจกรรม</h1>
        {activity && <p className="text-gray-500 font-thai">{activity.name}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-thai">ข้อมูลกิจกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activity ? (
            <ActivityForm
              activity={activity}
              onSuccess={() => router.push(`/admin/activities/${params.id}`)}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
