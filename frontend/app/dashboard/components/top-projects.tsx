"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useTopProjects } from "@/lib/hooks"
import type { TimePeriod } from "@/types/analytics"

interface TopProjectsProps {
  limit?: number;
  period?: TimePeriod;
}

export function TopProjects({ limit = 5, period = 'month' }: TopProjectsProps) {
  const { data, loading, error } = useTopProjects(limit, period)

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Error loading top projects: {error?.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'today': return 'Today'
      case 'week': return 'This Week'
      case 'month': return 'This Month'
      case 'all': return 'All Time'
      default: return 'This Month'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Projects</CardTitle>
        <CardDescription>
          Most worked on projects - {getPeriodLabel(period)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.topProjects.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No project data available
          </div>
        ) : (
          <div className="space-y-2">
            {data.topProjects.map((project) => (
                  <div
                    key={project.rank}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl min-w-10 text-center">
                        {getMedalEmoji(project.rank)}
                      </div>
                      <div>
                        <div className="font-medium">{project.projectName}</div>
                        {project.projectId && (
                          <div className="text-xs text-muted-foreground">
                            Project ID: {project.projectId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {project.totalHours.toFixed(1)}h
                      </Badge>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
