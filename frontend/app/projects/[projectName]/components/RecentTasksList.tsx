"use client"

import { Track } from '@/types/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { sortTracksByRecent } from '@/lib/track-calculations'
import { formatRelativeTime, formatDuration } from '@/lib/date-utils'
import { ArrowRight } from 'lucide-react'

interface RecentTasksListProps {
  tracks: Track[]
  limit?: number
}

export function RecentTasksList({ tracks, limit = 5 }: RecentTasksListProps) {
  const recentTracks = sortTracksByRecent(tracks).slice(0, limit)

  // Calculate max duration for progress bar scaling
  const maxDuration = Math.max(...recentTracks.map((t) => t.duration), 1)

  if (recentTracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No recent tasks</p>
          <p className="text-sm text-muted-foreground mt-1">
            🎯 Start tracking time
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Tasks</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1">
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentTracks.map((track) => {
          const barWidth = (track.duration / maxDuration) * 100

          return (
            <div
              key={track.id}
              className="group p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-150 hover:translate-x-1"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={track.description || undefined}>
                    {track.description || 'No description'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(track.start)}
                  </p>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">
                  {formatDuration(track.duration)}
                </div>
              </div>

              {/* Duration Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
