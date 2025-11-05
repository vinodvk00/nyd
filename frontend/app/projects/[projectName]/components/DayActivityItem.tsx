"use client"

import { Track } from '@/types/analytics'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatRelativeDate } from '@/lib/date-utils'
import { calculateTotalHours } from '@/lib/track-calculations'
import { SessionTimelineItem } from './SessionTimelineItem'
import { cn } from '@/lib/utils'

interface DayActivityItemProps {
  date: string // YYYY-MM-DD format
  tracks: Track[]
  isExpanded: boolean
  onToggle: () => void
}

export function DayActivityItem({
  date,
  tracks,
  isExpanded,
  onToggle,
}: DayActivityItemProps) {
  const dayTotal = calculateTotalHours(tracks)
  const sessionCount = tracks.length

  // Sort tracks by start time
  const sortedTracks = [...tracks].sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day Header - Clickable */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between",
          "hover:bg-muted/50 transition-colors",
          "text-left"
        )}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <div className="font-medium">
              {formatRelativeDate(date)} - {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="text-sm text-muted-foreground">
              {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </div>
          </div>
        </div>

        <div className="font-semibold text-lg">
          {dayTotal.toFixed(1)} hrs
        </div>
      </button>

      {/* Sessions Timeline - Expandable with smooth transition */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-3 bg-muted/20 space-y-3">
          {sortedTracks.map((track) => (
            <SessionTimelineItem key={track.id} track={track} />
          ))}
        </div>
      </div>
    </div>
  )
}
