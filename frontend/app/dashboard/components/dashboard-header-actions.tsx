"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { format } from "date-fns"
import type { TimePeriod, CustomDateRange } from "@/types/analytics"

const PERIOD_LABELS: Record<TimePeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
  custom: 'Custom',
}

interface PeriodSelectorProps {
  period: TimePeriod
  customRange: CustomDateRange
  onPeriodChange: (period: TimePeriod) => void
  onOpenCustomDatePicker: () => void
}

export function PeriodSelector({
  period,
  customRange,
  onPeriodChange,
  onOpenCustomDatePicker,
}: PeriodSelectorProps) {
  const getPeriodDisplay = () => {
    if (period === 'custom' && customRange.startDate && customRange.endDate) {
      return `${format(customRange.startDate, 'MMM dd')} - ${format(customRange.endDate, 'MMM dd')}`
    }
    return PERIOD_LABELS[period]
  }

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    if (newPeriod === 'custom') {
      onOpenCustomDatePicker()
      return
    }
    onPeriodChange(newPeriod)
  }

  return (
    <Select value={period} onValueChange={handlePeriodChange}>
      <SelectTrigger className="w-auto h-8 text-xs gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{getPeriodDisplay()}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="week">This Week</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
        <SelectItem value="all">All Time</SelectItem>
        <div className="h-px bg-border my-1" />
        <div
          className="relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm select-none hover:bg-accent hover:text-accent-foreground"
          onClick={(e) => {
            e.stopPropagation()
            onOpenCustomDatePicker()
          }}
        >
          <Calendar className="h-4 w-4" />
          <span>Custom Range...</span>
        </div>
      </SelectContent>
    </Select>
  )
}

interface SyncButtonProps {
  syncing: boolean
  onSync: () => void
}

export function SyncButton({ syncing, onSync }: SyncButtonProps) {
  return (
    <Button
      onClick={onSync}
      disabled={syncing}
      size="sm"
      variant="outline"
      className="min-w-[120px]"
    >
      {syncing ? 'Syncing...' : 'Sync from Toggl'}
    </Button>
  )
}
