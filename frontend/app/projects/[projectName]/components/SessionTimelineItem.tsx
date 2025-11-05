"use client"

import { Track } from '@/types/analytics'
import { formatTimeRange, formatDuration } from '@/lib/date-utils'
import { calculateEndTime } from '@/lib/track-calculations'

interface SessionTimelineItemProps {
  track: Track
}

export function SessionTimelineItem({ track }: SessionTimelineItemProps) {
  const startTime = new Date(track.start)
  const endTime = calculateEndTime(track)
  const timeRange = formatTimeRange(startTime, endTime)
  const duration = formatDuration(track.duration)

  return (
    <div className="relative pl-6 pb-3 last:pb-0">
      {/* Timeline Connector Line */}
      <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />

      {/* Timeline Dot */}
      <div className="absolute left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-background" />

      {/* Content */}
      <div className="space-y-1">
        {/* Time Range and Duration */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{timeRange}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium">{duration}</span>
        </div>

        {/* Description */}
        {track.description && (
          <div className="text-sm">
            {track.description}
          </div>
        )}
        {!track.description && (
          <div className="text-sm text-muted-foreground italic">
            No description
          </div>
        )}
      </div>
    </div>
  )
}
