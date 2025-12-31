"use client"

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { Track } from '@/types/analytics'
import { ProjectDetailHeader } from './components/ProjectDetailHeader'
import { DailyActivityList } from './components/DailyActivityList'
import { TaskDistributionCard } from './components/TaskDistributionCard'
import { WeeklyActivityCard } from './components/WeeklyActivityCard'
import { WorkPatternsCard } from './components/WorkPatternsCard'
import { SessionStatsCard } from './components/SessionStatsCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error('Failed to fetch');
  }

  return response.json();
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectName = decodeURIComponent(params.projectName as string)

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const buildApiUrl = () => {
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/tracks`

    if (startDate && endDate) {
      return `${baseUrl}/date-range?startDate=${startDate}&endDate=${endDate}&projectName=${encodeURIComponent(projectName)}`
    }

    return `${baseUrl}/project/${encodeURIComponent(projectName)}`
  }

  const { data: tracks, error, isLoading } = useSWR<Track[]>(
    buildApiUrl(),
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false, 
    }
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>

        {/* Daily Activity Skeleton */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </CardContent>
        </Card>

        {/* Recent Tasks Skeleton */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto px-4 py-4 sm:p-6">
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="text-6xl">⚠️</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">Error Loading Project</h2>
              <p className="text-muted-foreground">
                {error.message || 'Failed to load project details. Please try again.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.refresh()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty State
  if (!tracks || tracks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4 sm:p-6">
        <Card className="max-w-2xl mx-auto mt-12">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="text-6xl">📊</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">No data for &quot;{projectName}&quot;</h2>
              <p className="text-muted-foreground">
                This project doesn&apos;t have any tracked time yet.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.refresh()}>
                Sync Data from Toggl
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success State
  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-6">
      <ProjectDetailHeader projectName={projectName} tracks={tracks} />

      {/* Two Column Layout: Timeline (40%) + Insights (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,40%)_1fr] gap-4 sm:gap-6">
        {/* Left: Daily Activity Timeline - Compact 40% */}
        <DailyActivityList tracks={tracks} />

        {/* Right: Project Insights - Expanded 60% */}
        <div className="space-y-4">
          <TaskDistributionCard tracks={tracks} />
          <WeeklyActivityCard tracks={tracks} />
          <WorkPatternsCard tracks={tracks} />
          <SessionStatsCard tracks={tracks} />
        </div>
      </div>
    </div>
  )
}
