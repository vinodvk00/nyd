"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { mutate } from "swr"
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
  const [syncing, setSyncing] = useState(false)

  const getPeriod = (): TimePeriod => {
    const urlPeriod = searchParams.get('period') as TimePeriod
    if (urlPeriod && VALID_PERIODS.includes(urlPeriod)) {
      return urlPeriod
    }
    return 'month' 
  }

  const getActiveTab = (): string => {
    const urlTab = searchParams.get('tab')
    if (urlTab && VALID_TABS.includes(urlTab)) {
      return urlTab
    }
    return 'overview' 
  }

  const period = getPeriod()
  const activeTab = getActiveTab()

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
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', newPeriod)
    router.push(`?${params.toString()}`, { scroll: false })

    localStorage.setItem('lastPeriod', newPeriod)
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

      alert(message)
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

        {/* Tab Content Container - Instant Switch (No Animation) */}
        <div>
          {/* Overview Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
            <div className="grid gap-6 lg:grid-cols-2">
              <ActivityChart groupBy="day" period={period} />
              <TopProjects limit={5} period={period} />
            </div>
          </div>

          {/* Projects Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'projects' ? 'block' : 'hidden'}`}>
            <ProjectBreakdown period={period} />
          </div>

          {/* Patterns Tab - Always mounted */}
          <div className={`space-y-6 ${activeTab === 'patterns' ? 'block' : 'hidden'}`}>
            <HourlyPattern period={period} />
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
