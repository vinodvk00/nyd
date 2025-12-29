"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivityData } from "@/lib/hooks"
import type { GroupBy, TimePeriod, CustomDateRange } from "@/types/analytics"
import { format, parseISO } from "date-fns"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ActivityChartProps {
  startDate?: string;
  endDate?: string;
  groupBy?: GroupBy;
  period?: TimePeriod;
  customRange?: CustomDateRange;
}

interface ChartDataItem {
  date: string;
  fullDate: string;
  hours: number;
  sessions: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: ChartDataItem;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const hours = data.hours;

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-lg">
      <p className="text-muted-foreground text-xs mb-2">{data.fullDate}</p>
      <p className="text-foreground text-xl font-semibold">
        {hours.toFixed(1)}
        <span className="text-muted-foreground text-sm font-normal ml-1">hours</span>
      </p>
    </div>
  );
}

export function ActivityChart({ startDate, endDate, groupBy = 'day', period, customRange }: ActivityChartProps) {
  const { data, loading, error } = useActivityData(startDate, endDate, groupBy, period, customRange)

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

  const formatAxisDate = (dateString: string, groupBy: GroupBy, index: number, total: number) => {
    try {
      const date = parseISO(dateString)
      if (groupBy === 'day') {
        if (index === 0 || (index > 0 && parseISO(data.data[index - 1]?.date).getMonth() !== date.getMonth())) {
          return format(date, 'MMM d')
        }
        return format(date, 'd')
      }
      switch (groupBy) {
        case 'week':
          return format(date, 'MMM d')
        case 'month':
          return format(date, 'MMM')
        default:
          return format(date, 'd')
      }
    } catch {
      return dateString
    }
  }

  const formatFullDate = (dateString: string, groupBy: GroupBy) => {
    try {
      const date = parseISO(dateString)
      switch (groupBy) {
        case 'day':
          return format(date, 'MMM d, yyyy')
        case 'week':
          return `Week of ${format(date, 'MMM d, yyyy')}`
        case 'month':
          return format(date, 'MMMM yyyy')
        default:
          return format(date, 'MMM d, yyyy')
      }
    } catch {
      return dateString
    }
  }

  const chartData: ChartDataItem[] = data.data.map((item, index) => ({
    date: formatAxisDate(item.date, groupBy, index, data.data.length),
    fullDate: formatFullDate(item.date, groupBy),
    hours: item.totalHours,
    sessions: item.sessionCount,
  }))

  const getGroupByLabel = (groupBy: GroupBy) => {
    switch (groupBy) {
      case 'day': return 'Daily'
      case 'week': return 'Weekly'
      case 'month': return 'Monthly'
      default: return 'Daily'
    }
  }

  const maxHours = Math.max(...chartData.map(d => d.hours), 1)
  const yAxisMax = Math.max(Math.ceil(maxHours / 2) * 2, 4)
  const yAxisTicks = Array.from({ length: yAxisMax / 2 + 1 }, (_, i) => i * 2)

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
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.15 200)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.7 0.15 200)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                  width={40}
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'oklch(0.5 0.05 265)', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="oklch(0.7 0.18 200)"
                  strokeWidth={2}
                  fill="url(#hoursGradient)"
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: 'oklch(0.15 0.03 265)',
                    strokeWidth: 2,
                    fill: 'oklch(0.7 0.18 200)',
                  }}
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
