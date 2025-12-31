"use client"

import { Suspense, useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { mutate } from "swr"
import { SummaryCards } from "./components/summary-cards"
import { ActivityChart } from "./components/activity-chart"
import { ProjectBreakdown } from "./components/project-breakdown"
import { TopProjects } from "./components/top-projects"
import { HourlyPattern } from "./components/hourly-pattern"
import { GoalsManagement } from "./components/goals-management"
import { PeriodSelector, SyncButton } from "./components/dashboard-header-actions"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { syncFromToggl } from "@/lib/api"
import { format } from "date-fns"
import { useHeaderLeftActions, useHeaderRightActions } from "@/contexts/header-context"
import type { TimePeriod, CustomDateRange } from "@/types/analytics"
import type { DateRange } from "react-day-picker"

const VALID_PERIODS: TimePeriod[] = ['today', 'week', 'month', 'all', 'custom']
const VALID_TABS = ['overview', 'projects', 'patterns', 'processes']

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [syncing, setSyncing] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customRange, setCustomRange] = useState<CustomDateRange>(() => {
    
    if (typeof window !== 'undefined') {
      const savedPeriod = localStorage.getItem('lastPeriod')
      if (savedPeriod === 'custom') {
        const savedStartDate = localStorage.getItem('customStartDate')
        const savedEndDate = localStorage.getItem('customEndDate')
        if (savedStartDate && savedEndDate) {
          return {
            startDate: new Date(savedStartDate),
            endDate: new Date(savedEndDate)
          }
        }
      }
    }
    return { startDate: null, endDate: null }
  })
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined)

  const getPeriod = (): TimePeriod => {
    const urlPeriod = searchParams.get('period') as TimePeriod
    if (urlPeriod && VALID_PERIODS.includes(urlPeriod)) {
      return urlPeriod
    }

    if (typeof window !== 'undefined') {
      const savedPeriod = localStorage.getItem('lastPeriod') as TimePeriod
      if (savedPeriod && VALID_PERIODS.includes(savedPeriod)) {
        return savedPeriod
      }
    }
    return 'month'
  }

  const getActiveTab = (): string => {
    const urlTab = searchParams.get('tab')
    if (urlTab && VALID_TABS.includes(urlTab)) {
      return urlTab
    }

    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('lastTab')
      if (savedTab && VALID_TABS.includes(savedTab)) {
        return savedTab
      }
    }
    return 'overview'
  }

  const period = getPeriod()
  const activeTab = getActiveTab()

  useEffect(() => {
    const urlPeriod = searchParams.get('period')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (urlPeriod === 'custom' && startDateStr && endDateStr) {
      const newRange = {
        startDate: new Date(startDateStr),
        endDate: new Date(endDateStr)
      }
      setCustomRange(newRange)
    } else if (urlPeriod !== 'custom') {
      setCustomRange({ startDate: null, endDate: null })
    }
  }, [searchParams])

  useEffect(() => {
    const urlPeriod = searchParams.get('period')
    const urlTab = searchParams.get('tab')

    if (!urlPeriod || !urlTab) {
      const savedPeriod = localStorage.getItem('lastPeriod') as TimePeriod
      const savedTab = localStorage.getItem('lastTab')

      const params = new URLSearchParams(searchParams.toString())
      let shouldUpdate = false

      if (!urlPeriod && savedPeriod && VALID_PERIODS.includes(savedPeriod)) {
        params.set('period', savedPeriod)
        shouldUpdate = true

        if (savedPeriod === 'custom') {
          const savedStartDate = localStorage.getItem('customStartDate')
          const savedEndDate = localStorage.getItem('customEndDate')
          if (savedStartDate && savedEndDate) {
            params.set('startDate', savedStartDate)
            params.set('endDate', savedEndDate)
          }
        }
      } else if (!urlPeriod) {
        params.set('period', 'month')
        shouldUpdate = true
      }

      if (!urlTab && savedTab && VALID_TABS.includes(savedTab)) {
        params.set('tab', savedTab)
        shouldUpdate = true
      } else if (!urlTab) {
        params.set('tab', 'overview')
        shouldUpdate = true
      }

      if (shouldUpdate) {
        router.replace(`?${params.toString()}`, { scroll: false })
      }
    }
  }, [])

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    if (newPeriod === 'custom') {
      openCustomDatePicker()
      return
    }

    if (newPeriod !== period) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('period', newPeriod)

      params.delete('startDate')
      params.delete('endDate')

      router.push(`?${params.toString()}`, { scroll: false })
      localStorage.setItem('lastPeriod', newPeriod)

      localStorage.removeItem('customStartDate')
      localStorage.removeItem('customEndDate')
    }
  }

  const openCustomDatePicker = () => {
    setTempRange(customRange.startDate && customRange.endDate ? {
      from: customRange.startDate,
      to: customRange.endDate
    } : undefined)
    setTimeout(() => setShowDatePicker(true), 0)
  }

  const handleApplyCustomRange = () => {
    if (!tempRange?.from || !tempRange?.to) return

    const newRange: CustomDateRange = {
      startDate: tempRange.from,
      endDate: tempRange.to
    }

    setCustomRange(newRange)
    setShowDatePicker(false)

    const params = new URLSearchParams(searchParams.toString())
    params.set('period', 'custom')
    params.set('startDate', format(tempRange.from, 'yyyy-MM-dd'))
    params.set('endDate', format(tempRange.to, 'yyyy-MM-dd'))

    router.push(`?${params.toString()}`, { scroll: false })

    localStorage.setItem('lastPeriod', 'custom')
    localStorage.setItem('customStartDate', format(tempRange.from, 'yyyy-MM-dd'))
    localStorage.setItem('customEndDate', format(tempRange.to, 'yyyy-MM-dd'))
  }

  const handleCancelCustomRange = () => {
    setShowDatePicker(false)
    setTempRange(undefined)
  }

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.push(`?${params.toString()}`, { scroll: false })

    localStorage.setItem('lastTab', newTab)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await syncFromToggl()

      const message = `Sync completed!\n\n` +
        `Total entries: ${result.total}\n` +
        `Created: ${result.created}\n` +
        `Updated: ${result.updated}\n` +
        `Skipped: ${result.skipped}` +
        (result.errors && result.errors.length > 0
          ? `\n\nWarning: ${result.errors.length} errors occurred`
          : '')

      await mutate(
        key => Array.isArray(key) && typeof key[0] === 'string',
        undefined,
        { revalidate: true }
      )

      if (typeof window !== 'undefined' && (window as any).__refreshProcessStats) {
        (window as any).__refreshProcessStats()
      }

      alert(message)
    } catch (error) {
      console.error('Sync failed:', error)
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSyncing(false)
    }
  }

  const leftActions = useMemo(() => (
    <PeriodSelector
      period={period}
      customRange={customRange}
      onPeriodChange={handlePeriodChange}
      onOpenCustomDatePicker={openCustomDatePicker}
    />
  ), [period, customRange])

  const rightActions = useMemo(() => (
    <SyncButton syncing={syncing} onSync={handleSync} />
  ), [syncing])

  useHeaderLeftActions(leftActions)
  useHeaderRightActions(rightActions)

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Date Range Picker Dialog */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="max-w-[95vw] sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
            <DialogDescription>
              Choose a start and end date for your custom time period
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-2 overflow-x-auto">
            <Calendar
              mode="range"
              selected={tempRange}
              onSelect={setTempRange}
              numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}
              disabled={(date) => date > new Date()}
            />
          </div>

          {tempRange?.from && tempRange?.to && (
            <div className="text-sm text-muted-foreground text-center pb-2">
              <span className="font-medium">{format(tempRange.from, 'MMM dd, yyyy')} - {format(tempRange.to, 'MMM dd, yyyy')}</span>
              <span className="ml-2 text-xs">
                ({Math.ceil((tempRange.to.getTime() - tempRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
              </span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCustomRange}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyCustomRange}
              disabled={!tempRange?.from || !tempRange?.to}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Statistics */}
      <div className="transition-all duration-300">
        <SummaryCards period={period} customRange={customRange} />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="processes">Goals</TabsTrigger>
        </TabsList>

        {/* Tab Content Container */}
        <div className="transition-all duration-300">
          {/* Overview Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
            <div className="grid gap-6 lg:grid-cols-2">
              <ActivityChart groupBy="day" period={period} customRange={customRange} />
              <TopProjects limit={5} period={period} customRange={customRange} />
            </div>
          </div>

          {/* Projects Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'projects' ? 'block' : 'hidden'}`}>
            <ProjectBreakdown period={period} customRange={customRange} />
          </div>

          {/* Patterns Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'patterns' ? 'block' : 'hidden'}`}>
            <HourlyPattern period={period} customRange={customRange} />
          </div>

          {/* Progress Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'processes' ? 'block' : 'hidden'}`}>
            <GoalsManagement />
          </div>
        </div>
      </Tabs>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
