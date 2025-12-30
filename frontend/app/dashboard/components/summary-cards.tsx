"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSummaryStats, useTrends } from "@/lib/hooks"
import { Activity, FolderOpen, Calendar, Timer } from "lucide-react"
import type { TimePeriod, CustomDateRange } from "@/types/analytics"

interface SummaryCardsProps {
  period?: TimePeriod;
  customRange?: CustomDateRange;
}

export function SummaryCards({ period = 'month', customRange }: SummaryCardsProps) {
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const { data: stats, loading: statsLoading, error: statsError } = useSummaryStats(period, customRange)
  const { data: hoursTrend, loading: trendLoading } = useTrends('hours', period, customRange)

  if ((statsLoading || trendLoading) && !stats) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
        <Card className="p-4 col-span-2 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </Card>
        <Card className="p-4 col-span-2 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </Card>
        <Card className="p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-16" />
        </Card>
        <Card className="p-4 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-8" />
          <Skeleton className="h-4 w-12" />
        </Card>
      </div>
    )
  }

  if (statsError || !stats) {
    return (
      <div className="text-destructive">
        Error loading summary stats: {statsError?.message}
      </div>
    )
  }

  const getTrendInfo = (trend: number) => {
    if (trend > 0) return { color: 'text-emerald-500', symbol: '↑' }
    if (trend < 0) return { color: 'text-red-500', symbol: '↓' }
    return { color: 'text-muted-foreground', symbol: '→' }
  }

  const trendInfo = hoursTrend ? getTrendInfo(hoursTrend.change) : null

  const formatDuration = (hours: number) => {
    const totalMinutes = Math.round(hours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-6">
      {/* Total Hours - 2 cols */}
      <Card className="p-4 col-span-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Total Hours</span>
        </div>

        <div className="flex items-end justify-between mt-2">
          <span className="text-3xl font-bold tracking-tight">{stats.totalHours.toFixed(1)}h</span>
          {hoursTrend && (
            <div className="text-right">
              <span className={`text-sm font-medium ${trendInfo?.color}`}>
                {trendInfo?.symbol} {Math.abs(hoursTrend.change).toFixed(0)}%
              </span>
              <p className="text-xs text-muted-foreground">from {hoursTrend.previous.toFixed(1)}h</p>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-1.5">
          {stats.loggedDays} of {stats.totalDays} days with activity
        </p>
      </Card>

      {/* Daily Average - 2 cols */}
      <Card className="p-4 col-span-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Daily Average</span>
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className="ml-auto flex items-center gap-1.5 cursor-pointer group"
          >
            <span className={`text-xs ${showActiveOnly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Active
            </span>
            <div className="relative w-8 h-4 bg-muted rounded-full group-hover:bg-muted/80">
              <div className={`absolute top-0.5 w-3 h-3 bg-foreground rounded-full transition-all ${showActiveOnly ? 'left-0.5' : 'left-[14px]'}`} />
            </div>
            <span className={`text-xs ${!showActiveOnly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              All
            </span>
          </button>
        </div>

        <div className="flex items-end justify-between mt-2">
          <span className="text-3xl font-bold tracking-tight">
            {showActiveOnly ? `${stats.avgHoursPerLoggedDay.toFixed(1)}h` : `${stats.avgHoursPerDay.toFixed(1)}h`}
          </span>
          <div className="grid grid-cols-[auto_1fr] gap-x-1.5 text-xs items-baseline">
            <span className="text-muted-foreground text-right">Peak:</span>
            <span className="font-medium tabular-nums">{stats.peakDayHours.toFixed(1)}h</span>
            <span className="text-muted-foreground text-right">Low:</span>
            <span className="font-medium tabular-nums">{stats.lowDayHours.toFixed(1)}h</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-1.5">
          {showActiveOnly ? `across ${stats.loggedDays} active days` : `across all ${stats.totalDays} days`}
        </p>
      </Card>

      {/* Avg Session - 1 col */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Avg Session</span>
        </div>

        <p className="text-2xl font-bold mt-2">{formatDuration(stats.averageSessionDuration)}</p>

        <p className="text-sm text-muted-foreground mt-1.5">{stats.totalSessions} sessions</p>
      </Card>

      {/* Projects - 1 col */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">Projects</span>
        </div>

        <p className="text-2xl font-bold mt-2">{stats.activeProjects}</p>

        <p className="text-sm text-muted-foreground mt-1.5">active</p>
      </Card>
    </div>
  )
}
