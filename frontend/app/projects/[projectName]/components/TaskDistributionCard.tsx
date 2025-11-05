"use client"

import { Track } from '@/types/analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarList } from '@tremor/react'
import { getTaskDistribution } from '@/lib/track-calculations'

interface TaskDistributionCardProps {
  tracks: Track[]
}

export function TaskDistributionCard({ tracks }: TaskDistributionCardProps) {
  const taskData = getTaskDistribution(tracks).slice(0, 6) // Top 6 tasks

  if (taskData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time by Task</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No task data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Time by Task</CardTitle>
      </CardHeader>
      <CardContent>
        <BarList
          data={taskData}
          valueFormatter={(value) => `${value}h`}
          className="mt-2"
        />
      </CardContent>
    </Card>
  )
}
