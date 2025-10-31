"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart } from "@tremor/react"
import { useActivityData } from "@/lib/hooks"
import type { GroupBy } from "@/types/analytics"

interface ActivityChartProps {
  startDate?: string;
  endDate?: string;
  groupBy?: GroupBy;
}

export function ActivityChart({ startDate, endDate, groupBy = 'day' }: ActivityChartProps) {
  const { data, loading, error } = useActivityData(startDate, endDate, groupBy)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Error loading activity data: {error?.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format data for Tremor chart
  const chartData = data.data.map(item => ({
    date: item.date,
    "Total Hours": item.totalHours,
    "Sessions": item.sessionCount,
  }))

  const getGroupByLabel = (groupBy: GroupBy) => {
    switch (groupBy) {
      case 'day': return 'Daily'
      case 'week': return 'Weekly'
      case 'month': return 'Monthly'
      default: return 'Daily'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          {getGroupByLabel(groupBy)} hours tracked over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No activity data available for this period
          </div>
        ) : (
          <AreaChart
            className="h-80"
            data={chartData}
            index="date"
            categories={["Total Hours"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value.toFixed(1)}h`}
            showLegend={true}
            showGridLines={true}
            curveType="monotone"
          />
        )}
      </CardContent>
    </Card>
  )
}
