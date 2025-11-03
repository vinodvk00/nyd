"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SummaryCards } from "./components/summary-cards"
import { ActivityChart } from "./components/activity-chart"
import { ProjectBreakdown } from "./components/project-breakdown"
import { TopProjects } from "./components/top-projects"
import { HourlyPattern } from "./components/hourly-pattern"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { syncFromToggl } from "@/lib/api"
import type { TimePeriod } from "@/types/analytics"

const VALID_PERIODS: TimePeriod[] = ['today', 'week', 'month', 'all']
const VALID_TABS = ['overview', 'projects', 'patterns']

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getInitialPeriod = (): TimePeriod => {
    const urlPeriod = searchParams.get('period') as TimePeriod
    if (urlPeriod && VALID_PERIODS.includes(urlPeriod)) {
      return urlPeriod
    }

    if (isClient) {
      const savedPeriod = localStorage.getItem('lastPeriod') as TimePeriod
      if (savedPeriod && VALID_PERIODS.includes(savedPeriod)) {
        return savedPeriod
      }
    }

    return 'month'
  }

  const getInitialTab = (): string => {
    const urlTab = searchParams.get('tab')
    if (urlTab && VALID_TABS.includes(urlTab)) {
      return urlTab
    }

    if (isClient) {
      const savedTab = localStorage.getItem('lastTab')
      if (savedTab && VALID_TABS.includes(savedTab)) {
        return savedTab
      }
    }

    return 'overview'
  }

  const [period, setPeriod] = useState<TimePeriod>(getInitialPeriod())
  const [activeTab, setActiveTab] = useState(getInitialTab())

  useEffect(() => {
    const urlPeriod = searchParams.get('period') as TimePeriod
    if (urlPeriod && VALID_PERIODS.includes(urlPeriod) && urlPeriod !== period) {
      setPeriod(urlPeriod)
    }
  }, [searchParams, period])

  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && VALID_TABS.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams, activeTab])

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod)

    const params = new URLSearchParams(searchParams.toString())
    params.set('period', newPeriod)
    router.push(`?${params.toString()}`, { scroll: false })

    if (isClient) {
      localStorage.setItem('lastPeriod', newPeriod)
    }
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)

    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.push(`?${params.toString()}`, { scroll: false })

    if (isClient) {
      localStorage.setItem('lastTab', newTab)
    }
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

      alert(message)

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Sync failed:', error)
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Time Period:</div>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing...' : 'Sync from Toggl'}
        </Button>
      </div>

      {/* Summary Statistics */}
      <SummaryCards period={period} />

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityChart groupBy="day" period={period} />
            <TopProjects limit={5} period={period} />
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <ProjectBreakdown period={period} />
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <HourlyPattern period={period} />
        </TabsContent>
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
