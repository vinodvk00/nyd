"use client"

import { Track } from '@/types/analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          variant="outline"
          onClick={handleSync}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Data
        </Button>
      </div>

      {/* Project Title & Last Activity */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {projectName}
        </h1>
        {stats.lastActivity && (
          <Badge variant="secondary" className="font-normal">
            Last activity: {formatRelativeTime(stats.lastActivity)}
          </Badge>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Time Card */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-4xl font-extrabold tracking-tight">
              {stats.totalHours.toFixed(1)}h
            </div>
            <Text className="mt-2 font-medium">Total Hours</Text>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-4xl font-extrabold tracking-tight">
              {stats.sessionCount}
            </div>
            <Text className="mt-2 font-medium">Sessions</Text>
          </CardContent>
        </Card>

        {/* Average Session Card */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-4xl font-extrabold tracking-tight">
              {stats.averageSessionDuration.toFixed(1)}h
            </div>
            <Text className="mt-2 font-medium">Hours per Session</Text>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
