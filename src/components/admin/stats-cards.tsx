import { Users, Calendar, ClipboardList, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const iconMap = {
  users: Users,
  calendar: Calendar,
  clipboard: ClipboardList,
  trending: TrendingUp,
}

interface Stat {
  label: string
  value: number | string
  icon: keyof typeof iconMap
  valueClass?: string
}

interface StatsCardsProps {
  stats: Stat[]
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon]
        return (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-thai flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stat.valueClass ?? ""}`}>{stat.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
