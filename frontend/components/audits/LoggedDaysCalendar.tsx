"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { eachDayOfInterval, format } from "date-fns";
import { useRouter } from "next/navigation";

interface LoggedDaysCalendarProps {
  auditId: string;
  startDate: string;
  endDate: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

export function LoggedDaysCalendar({
  auditId,
  startDate,
  endDate,
}: LoggedDaysCalendarProps) {
  const router = useRouter();

  const { data: entries } = useSWR<any[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/time-entries/audit/${auditId}`,
    fetcher
  );

  const dayStats = useMemo(() => {
    const stats: Record<string, { hours: number; entryCount: number }> = {};

    if (entries) {
      entries.forEach((entry) => {
        if (!stats[entry.date]) {
          stats[entry.date] = { hours: 0, entryCount: 0 };
        }
        stats[entry.date].hours += (entry.durationMinutes || 60) / 60;
        stats[entry.date].entryCount += 1;
      });
    }

    return stats;
  }, [entries]);

  const allDays = useMemo(() => {
    try {
      return eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate),
      });
    } catch (error) {
      return [];
    }
  }, [startDate, endDate]);

  const getStatusColor = (hours: number) => {
    if (hours >= 20) {
      return "bg-success/20 border-success text-success";
    } else if (hours > 0) {
      return "bg-warning/20 border-warning text-warning-foreground";
    } else {
      return "bg-muted border-border text-muted-foreground";
    }
  };

  const getStatusIcon = (hours: number) => {
    if (hours >= 20) return "✅";
    if (hours > 0) return "⚠️";
    return "⚫";
  };

  const handleDayClick = (dateStr: string) => {
    router.push(`/audits/${auditId}/log?date=${dateStr}`);
  };

  if (allDays.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Invalid date range
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Your Progress
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>✅ Complete (≥20h)</span>
          <span>⚠️ Partial (&lt;20h)</span>
          <span>⚫ Not logged</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {allDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const stats = dayStats[dateStr] || { hours: 0, entryCount: 0 };
          const hours = stats.hours;
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(dateStr)}
              className={`
                p-3 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md
                ${getStatusColor(hours)}
                ${isToday ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}
              `}
              title={`${format(day, "EEEE, MMMM d, yyyy")}\n${hours.toFixed(
                1
              )} hours logged (${stats.entryCount} entries)`}
            >
              <div className="text-xs font-medium opacity-75">
                {format(day, "EEE")}
              </div>
              <div className="text-xl font-bold my-1">{format(day, "d")}</div>
              <div className="text-xs">{getStatusIcon(hours)}</div>
              <div className="text-xs font-semibold mt-1">
                {hours > 0 ? `${hours.toFixed(0)}h` : "—"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-4 p-3 bg-muted rounded-lg grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Total Days</p>
          <p className="text-lg font-bold">{allDays.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Days Logged</p>
          <p className="text-lg font-bold text-info">
            {Object.keys(dayStats).length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-lg font-bold text-success">
            {Object.values(dayStats).filter((s) => s.hours >= 20).length}
          </p>
        </div>
      </div>
    </div>
  );
}
