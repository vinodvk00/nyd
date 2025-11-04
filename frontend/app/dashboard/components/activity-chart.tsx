"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart } from "@tremor/react"
import { useActivityData } from "@/lib/hooks"
import type { GroupBy, TimePeriod } from "@/types/analytics"
import { format, parseISO } from "date-fns"

interface ActivityChartProps {
  startDate?: string;
  endDate?: string;
  groupBy?: GroupBy;
  period?: TimePeriod;
}

export function ActivityChart({ startDate, endDate, groupBy = 'day', period }: ActivityChartProps) {
  const { data, loading, error } = useActivityData(startDate, endDate, groupBy, period)

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
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

  const formatDate = (dateString: string, groupBy: GroupBy, index: number, total: number) => {
    try {
      const date = parseISO(dateString)

      if (groupBy === 'day') {
        if (index === 0) {
          return format(date, 'MMM d')
        } else if (index === total - 1) {
          const firstDate = parseISO(data.data[0].date)
          if (date.getMonth() === firstDate.getMonth()) {
            return format(date, 'd')
          } else {
            return format(date, 'MMM d') 
          }
        } else {
          return format(date, 'd')
        }
      }

      switch (groupBy) {
        case 'week':
          return format(date, 'MMM d')
        case 'month':
          return format(date, 'MMM yyyy')
        default:
          return format(date, 'd')
      }
    } catch {
      return dateString
    }
  }

  const chartData = data.data.map((item, index) => ({
    date: formatDate(item.date, groupBy, index, data.data.length),
    "Hours": item.totalHours,
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
            categories={["Hours"]}
            colors={["cyan"]}
            valueFormatter={(value) => `${value.toFixed(1)}h`}
            showLegend={false}
            showGridLines={true}
            showXAxis={true}
            showYAxis={true}
            yAxisWidth={56}
            curveType="monotone"
            autoMinValue={false}
            minValue={0}
            allowDecimals={true}
            connectNulls={true}
          />
        )}
      </CardContent>
    </Card>
  )
}
