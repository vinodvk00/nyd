"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHourlyPattern } from "@/lib/hooks";
import type { TimePeriod, CustomDateRange } from "@/types/analytics";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HourlyPatternProps {
  startDate?: string;
  endDate?: string;
  period?: TimePeriod;
  customRange?: CustomDateRange;
}

interface ChartDataItem {
  hour: string;
  hours: number;
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
      <p className="text-muted-foreground text-xs mb-2">{data.hour}</p>
      <p className="text-foreground text-xl font-semibold">
        {hours.toFixed(1)}
        <span className="text-muted-foreground text-sm font-normal ml-1">hours</span>
      </p>
    </div>
  );
}

export function HourlyPattern({
  startDate,
  endDate,
  period,
  customRange,
}: HourlyPatternProps) {
  const { data, loading, error } = useHourlyPattern(
    startDate,
    endDate,
    period,
    customRange
  );

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Error loading hourly pattern: {error?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const chartData: ChartDataItem[] = data.hourlyDistribution
    .sort((a, b) => a.hour - b.hour)
    .map((item) => ({
      hour: formatHour(item.hour),
      hours: item.totalHours,
    }));

  const peakHour =
    data.hourlyDistribution.length > 0
      ? data.hourlyDistribution.reduce((prev, current) =>
          current.totalHours > prev.totalHours ? current : prev
        )
      : null;

  const maxHours = Math.max(...chartData.map(d => d.hours), 1);
  const yAxisMax = Math.max(Math.ceil(maxHours / 2) * 2, 4);
  const yAxisTicks = Array.from({ length: yAxisMax / 2 + 1 }, (_, i) => i * 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Activity Pattern</CardTitle>
        <CardDescription>
          When you work most during the day
          {peakHour && (
            <span className="block mt-1 text-primary font-medium">
              Peak productivity: {formatHour(peakHour.hour)} (
              {peakHour.totalHours.toFixed(1)}h)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.hourlyDistribution.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No hourly pattern data available
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border"
                />
                <XAxis
                  dataKey="hour"
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
                  cursor={{ fill: 'oklch(0.5 0.05 265 / 0.2)' }}
                />
                <Bar
                  dataKey="hours"
                  fill="oklch(0.7 0.18 200)"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
