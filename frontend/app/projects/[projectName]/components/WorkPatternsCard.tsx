"use client"

import { Track } from '@/types/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Clock, Calendar, Timer } from 'lucide-react'
import { getWorkPatterns } from '@/lib/track-calculations'

interface WorkPatternsCardProps {
  tracks: Track[]
}

export function WorkPatternsCard({ tracks }: WorkPatternsCardProps) {
  const patterns = getWorkPatterns(tracks)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Work Patterns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Most productive:</p>
            <p className="text-sm text-muted-foreground truncate">
              {patterns.mostProductiveTime} ({patterns.mostProductiveTimeHours}h)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Busiest day:</p>
            <p className="text-sm text-muted-foreground truncate">
              {patterns.busiestDay} ({patterns.busiestDayHours}h)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Timer className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Avg session:</p>
            <p className="text-sm text-muted-foreground truncate">
              {patterns.avgSessionHours}h per session
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
