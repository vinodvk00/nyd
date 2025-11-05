"use client"

import { Track } from '@/types/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getLongestSession, getShortestSession, getMedianSession } from '@/lib/track-calculations'
import { formatRelativeDate } from '@/lib/date-utils'

interface SessionStatsCardProps {
  tracks: Track[]
}

export function SessionStatsCard({ tracks }: SessionStatsCardProps) {
  const longest = getLongestSession(tracks)
  const shortest = getShortestSession(tracks)
  const median = getMedianSession(tracks)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session Extremes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {longest && (
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">Longest:</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeDate(new Date(longest.start).toISOString().split('T')[0])}
              </p>
            </div>
            <p className="text-sm font-medium">{(longest.duration / 3600).toFixed(1)}h</p>
          </div>
        )}

        {shortest && (
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium">Shortest:</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeDate(new Date(shortest.start).toISOString().split('T')[0])}
              </p>
            </div>
            <p className="text-sm font-medium">{(shortest.duration / 3600).toFixed(1)}h</p>
          </div>
        )}

        <div className="flex justify-between items-start pt-2 border-t">
          <p className="text-sm font-medium">Median:</p>
          <p className="text-sm font-medium">{median.toFixed(1)}h</p>
        </div>
      </CardContent>
    </Card>
  )
}
