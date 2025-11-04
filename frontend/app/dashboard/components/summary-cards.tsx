"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useSummaryStats, useTrends } from "@/lib/hooks"
import type { TimePeriod } from "@/types/analytics"

interface SummaryCardsProps {
  period?: TimePeriod;
}

export function SummaryCards({ period = 'month' }: SummaryCardsProps) {
  const { data: stats, loading: statsLoading, error: statsError } = useSummaryStats(period)
  const { data: hoursTrend, loading: trendLoading } = useTrends('hours', period)

  if ((statsLoading || trendLoading) && !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
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
    if (trend > 0) return { color: 'text-green-600', symbol: '↑', text: 'increase' }
    if (trend < 0) return { color: 'text-red-600', symbol: '↓', text: 'decrease' }
    return { color: 'text-gray-600', symbol: '→', text: 'stable' }
  }

  const trendInfo = hoursTrend ? getTrendInfo(hoursTrend.change) : null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Hours Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
          {trendInfo && (
            <p className={`text-xs ${trendInfo.color} mt-1`}>
              {trendInfo.symbol} {Math.abs(hoursTrend?.change || 0).toFixed(1)}% from last period
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Tracked this {period}
          </p>
        </CardContent>
      </Card>

      {/* Total Sessions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Work sessions recorded
          </p>
        </CardContent>
      </Card>

      {/* Average Session Duration Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageSessionDuration.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Average time per session
          </p>
        </CardContent>
      </Card>

      {/* Active Projects Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeProjects}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Projects with tracked time
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
