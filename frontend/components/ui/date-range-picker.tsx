"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  value?: DateRange
  onSelect?: (range: DateRange | undefined) => void
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  value,
  onSelect,
  className,
  disabled
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [localRange, setLocalRange] = React.useState<DateRange | undefined>(value)

  React.useEffect(() => {
    setLocalRange(value)
  }, [value])

  const handleSelect = (range: DateRange | undefined) => {
    setLocalRange(range)
  }

  const handleApply = () => {
    onSelect?.(localRange)
    setOpen(false)
  }

  const handleCancel = () => {
    setLocalRange(value)
    setOpen(false)
  }

  const displayText = React.useMemo(() => {
    if (localRange?.from) {
      if (localRange.to) {
        return `${format(localRange.from, "MMM dd, yyyy")} - ${format(localRange.to, "MMM dd, yyyy")}`
      }
      return format(localRange.from, "MMM dd, yyyy")
    }
    return "Pick a date range"
  }, [localRange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !localRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="range"
            selected={localRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
            initialFocus
          />
          <div className="flex items-center justify-between border-t pt-3">
            <div className="text-sm text-muted-foreground">
              {localRange?.from && localRange?.to && (
                <>
                  {Math.ceil((localRange.to.getTime() - localRange.from.getTime()) / (1000 * 60 * 60 * 24))} days selected
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!localRange?.from || !localRange?.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
