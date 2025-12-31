"use client"

import { Track } from '@/types/analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Metric, Text } from '@tremor/react'
import { calculateProjectStats } from '@/lib/track-calculations'
import { formatRelativeTime } from '@/lib/date-utils'

interface ProjectDetailHeaderProps {
  projectName: string
  tracks: Track[]
}

export function ProjectDetailHeader({ projectName, tracks }: ProjectDetailHeaderProps) {
  const router = useRouter()
  const stats = calculateProjectStats(tracks)

  const handleSync = async () => {
    // TODO: Implement sync functionality
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="gap-1.5"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleSync}
                className="gap-1.5"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Sync</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh project data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Project Title & Last Activity */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
          {projectName}
        </h1>
        {stats.lastActivity && (
          <Badge variant="secondary" className="font-normal">
            Last activity: {formatRelativeTime(stats.lastActivity)}
          </Badge>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Total Time Card */}
        <Card className="border-2">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="text-xl sm:text-4xl font-extrabold tracking-tight">
              {stats.totalHours.toFixed(1)}h
            </div>
            <Text className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium">Total Hours</Text>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card className="border-2">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="text-xl sm:text-4xl font-extrabold tracking-tight">
              {stats.sessionCount}
            </div>
            <Text className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium">Sessions</Text>
          </CardContent>
        </Card>

        {/* Average Session Card */}
        <Card className="border-2">
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="text-xl sm:text-4xl font-extrabold tracking-tight">
              {stats.averageSessionDuration.toFixed(1)}h
            </div>
            <Text className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium">Avg/Session</Text>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
