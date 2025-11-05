"use client"

import { Track } from '@/types/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getThisWeekStats } from '@/lib/track-calculations'

interface WeeklyActivityCardProps {
  tracks: Track[]
}

export function WeeklyActivityCard({ tracks }: WeeklyActivityCardProps) {
  const { thisWeekHours, trend } = getThisWeekStats(tracks)

  const getTrendIcon = () => {
    if (trend > 5) return <TrendingUp className="h-3 w-3" />
    if (trend < -5) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (trend > 5) return 'bg-green-500/10 text-green-700 dark:text-green-400'
    if (trend < -5) return 'bg-red-500/10 text-red-700 dark:text-red-400'
    return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">This Week</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-3xl font-bold">{thisWeekHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
        </div>

        <Badge variant="outline" className={`gap-1 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{Math.abs(trend).toFixed(0)}% vs last week</span>
        </Badge>
      </CardContent>
    </Card>
  )
}
