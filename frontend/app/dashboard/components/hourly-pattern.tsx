"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@tremor/react";
import { useHourlyPattern } from "@/lib/hooks";
import type { TimePeriod, CustomDateRange } from "@/types/analytics";

interface HourlyPatternProps {
  startDate?: string;
  endDate?: string;
  period?: TimePeriod;
  customRange?: CustomDateRange;
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

  // Format hour in 12-hour format
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Format data for Tremor chart
  const chartData = data.hourlyDistribution
    .sort((a, b) => a.hour - b.hour)
    .map((item) => ({
      hour: formatHour(item.hour),
      Hours: item.totalHours,
    }));

  const peakHour =
    data.hourlyDistribution.length > 0
      ? data.hourlyDistribution.reduce((prev, current) =>
          current.totalHours > prev.totalHours ? current : prev
        )
      : null;

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
            <BarChart
              className="h-full w-full"
              data={chartData}
              index="hour"
              categories={["Hours"]}
              colors={["cyan"]}
              valueFormatter={(value) => `${value.toFixed(1)}h`}
              showLegend={false}
              showGridLines={true}
              yAxisWidth={48}
              showXAxis={true}
              showYAxis={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
