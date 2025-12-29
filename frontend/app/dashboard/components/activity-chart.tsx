"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useActivityData, useDayTracks } from "@/lib/hooks"
import type { GroupBy, TimePeriod, CustomDateRange, Track } from "@/types/analytics"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Clock } from "lucide-react"
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
  rawDate: string;
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTimeRange(start: string, durationSeconds: number): string {
  const startDate = parseISO(start);
  const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
  return `${format(startDate, 'h:mm a')} → ${format(endDate, 'h:mm a')}`;
}

interface SessionItemProps {
  track: Track;
}

function SessionItem({ track }: SessionItemProps) {
  const durationHours = (track.duration / 3600).toFixed(1);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Clock className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {track.description || 'No description'}
        </p>
        <p className="text-sm text-muted-foreground">
          {track.projectName || 'No project'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-foreground">{durationHours}h</p>
        <p className="text-xs text-muted-foreground">
          {formatTimeRange(track.start, track.duration)}
        </p>
      </div>
    </div>
  );
}

export function ActivityChart({ startDate, endDate, groupBy = 'day', period, customRange }: ActivityChartProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>("");

  const { data, loading, error } = useActivityData(startDate, endDate, groupBy, period, customRange)

  const {
    data: dayTracks,
    loading: tracksLoading
  } = useDayTracks(selectedDay);

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

  const formatAxisDate = (dateString: string, groupBy: GroupBy, index: number) => {
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
          return format(date, 'EEEE, MMM d, yyyy')
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
    date: formatAxisDate(item.date, groupBy, index),
    rawDate: item.date,
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

  const handleDayClick = (data: ChartDataItem) => {
    if (groupBy === 'day') {
      setSelectedDay(data.rawDate);
      setSelectedDayLabel(data.fullDate);
    }
  }

  const handleBack = () => {
    setSelectedDay(null);
    setSelectedDayLabel("");
  }

  // Day drill-down view - show actual time entries
  if (selectedDay && dayTracks) {
    const sortedTracks = [...dayTracks].sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const totalHours = sortedTracks.reduce((sum, t) => sum + t.duration, 0) / 3600;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle>{selectedDayLabel}</CardTitle>
              <CardDescription>
                {sortedTracks.length} session{sortedTracks.length !== 1 ? 's' : ''} • {totalHours.toFixed(1)} hours total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tracksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sortedTracks.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
              No activity recorded on this day
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {sortedTracks.map((track) => (
                <SessionItem key={track.id} track={track} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Daily/weekly/monthly view
  const maxHours = Math.max(...chartData.map(d => d.hours), 1)
  const yAxisMax = Math.max(Math.ceil(maxHours / 2) * 2, 4)
  const yAxisTicks = Array.from({ length: yAxisMax / 2 + 1 }, (_, i) => i * 2)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          {getGroupByLabel(groupBy)} hours tracked over time
          {groupBy === 'day' && <span className="text-xs ml-2">(click a day for details)</span>}
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
              <RechartsAreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    handleDayClick(e.activePayload[0].payload as ChartDataItem);
                  }
                }}
                style={{ cursor: groupBy === 'day' ? 'pointer' : 'default' }}
              >
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
                    cursor: groupBy === 'day' ? 'pointer' : 'default',
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
