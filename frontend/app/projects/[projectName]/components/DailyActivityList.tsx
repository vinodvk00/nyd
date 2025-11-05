"use client"

import { useState } from 'react'
import { Track } from '@/types/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatTimeRange, formatDuration } from '@/lib/date-utils'
import { calculateEndTime } from '@/lib/track-calculations'
import { cn } from '@/lib/utils'

interface DailyActivityListProps {
  tracks: Track[]
  initialDaysToShow?: number
}

export function DailyActivityList({
  tracks,
  initialDaysToShow = 7,
}: DailyActivityListProps) {
  // Sort all tracks by date descending
  const sortedTracks = [...tracks].sort((a, b) =>
    new Date(b.start).getTime() - new Date(a.start).getTime()
  )

  // Group by date for collapse functionality
  const tracksByDate = sortedTracks.reduce((acc, track) => {
    const dateKey = new Date(track.start).toISOString().split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(track)
    return acc
  }, {} as Record<string, Track[]>)

  const allDates = Object.keys(tracksByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  // State
  const [visibleDays, setVisibleDays] = useState(initialDaysToShow)
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set())

  const displayedDates = allDates.slice(0, visibleDays)
  const hasMore = allDates.length > visibleDays

  const toggleDate = (dateKey: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateKey)) {
        next.delete(dateKey)
      } else {
        next.add(dateKey)
      }
      return next
    })
  }

  const collapseAll = () => {
    // Only collapse dates with more than 1 task
    const multiTaskDates = displayedDates.filter(date => tracksByDate[date].length > 1)
    setCollapsedDates(new Set(multiTaskDates))
  }

  const expandAll = () => {
    setCollapsedDates(new Set())
  }

  const allCollapsed = displayedDates
    .filter(date => tracksByDate[date].length > 1)
    .every(date => collapsedDates.has(date))

  if (sortedTracks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <p className="text-muted-foreground">No activity found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Daily Activity</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={allCollapsed ? expandAll : collapseAll}
          className="text-sm"
        >
          {allCollapsed ? 'Expand All' : 'Collapse All'}
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Continuous Timeline */}
        <div className="relative">
          {/* Main vertical line */}
          <div className="absolute left-[100px] top-0 bottom-0 w-px bg-border" />

          {/* Tasks */}
          <div className="space-y-0">
            {displayedDates.map((dateKey, dateIndex) => {
              const dateTracks = tracksByDate[dateKey]
              const isCollapsed = collapsedDates.has(dateKey)
              const dateObj = new Date(dateKey)
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })
              const totalDuration = (dateTracks.reduce((sum, t) => sum + t.duration, 0) / 3600).toFixed(1)
              const hasMultipleTasks = dateTracks.length > 1

              return (
                <div key={dateKey} className="pb-6">
                  {/* Date Header - Date LEFT of line, Duration RIGHT of line */}
                  <div className="grid grid-cols-[92px_8px_auto] gap-0 items-center pb-3">
                    {/* Date - LEFT of timeline */}
                    <div className="text-right pr-2">
                      {hasMultipleTasks ? (
                        <button
                          onClick={() => toggleDate(dateKey)}
                          className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          <span>{formattedDate}</span>
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <div className="text-base font-semibold text-foreground">{formattedDate}</div>
                      )}
                    </div>

                    {/* Timeline spacer */}
                    <div></div>

                    {/* Total Duration - RIGHT of timeline */}
                    <div className="text-sm font-medium text-muted-foreground pl-3">
                      {totalDuration} hrs
                    </div>
                  </div>

                  {/* Tasks */}
                  {!isCollapsed && dateTracks.map((track, trackIndex) => {
                    const startTime = new Date(track.start)
                    const endTime = calculateEndTime(track)
                    const timeRange = formatTimeRange(startTime, endTime)
                    const duration = formatDuration(track.duration)

                    return (
                      <div
                        key={track.id}
                        className="grid grid-cols-[92px_8px_auto] gap-0 items-start pb-5"
                      >
                        {/* Left space */}
                        <div></div>

                        {/* Timeline Dot */}
                        <div className="relative flex justify-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-background z-10 mt-2" />
                        </div>

                        {/* Task Content */}
                        <div className="pl-3 space-y-0.5">
                          {/* Task Title */}
                          <div className="font-medium text-base leading-snug text-foreground">
                            {track.description || (
                              <span className="text-muted-foreground italic">
                                No description
                              </span>
                            )}
                          </div>

                          {/* Time Range & Duration - TERTIARY */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{timeRange}</span>
                            <span>•</span>
                            <span>{duration}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Collapsed day summary */}
                  {isCollapsed && (
                    <div className="grid grid-cols-[92px_8px_auto] gap-0 pb-2">
                      <div></div>
                      <div></div>
                      <div className="pl-3 text-sm text-muted-foreground italic">
                        {dateTracks.length} {dateTracks.length === 1 ? 'task' : 'tasks'} hidden
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="pt-4 text-center border-t">
            <Button
              variant="outline"
              onClick={() => setVisibleDays((prev) => prev + 7)}
            >
              Load More Days
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
