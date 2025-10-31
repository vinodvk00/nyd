"use client"

import { useState } from "react"
import { SummaryCards } from "./components/summary-cards"
import { ActivityChart } from "./components/activity-chart"
import { ProjectBreakdown } from "./components/project-breakdown"
import { TopProjects } from "./components/top-projects"
import { HourlyPattern } from "./components/hourly-pattern"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TimePeriod } from "@/types/analytics"

export default function DashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>('month')
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      // You can add sync functionality here
      // await syncFromToggl()
      alert('Sync functionality - coming soon!')
    } catch (error) {
      console.error('Sync failed:', error)
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
          <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityChart groupBy="day" />
            <TopProjects limit={5} period={period} />
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <ProjectBreakdown />
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <HourlyPattern />
        </TabsContent>
      </Tabs>
    </div>
  )
}
