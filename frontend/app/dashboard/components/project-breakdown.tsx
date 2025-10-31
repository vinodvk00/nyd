"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DonutChart, BarList } from "@tremor/react"
import { useProjectBreakdown } from "@/lib/hooks"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectBreakdownProps {
  startDate?: string;
  endDate?: string;
}

export function ProjectBreakdown({ startDate, endDate }: ProjectBreakdownProps) {
  const { data, loading, error } = useProjectBreakdown(startDate, endDate)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Error loading project data: {error?.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format data for Tremor charts
  const donutData = data.projects.map(project => ({
    name: project.projectName,
    value: project.totalHours,
  }))

  const barListData = data.projects.map(project => ({
    name: project.projectName,
    value: project.totalHours,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Breakdown</CardTitle>
        <CardDescription>
          Time distribution across projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.projects.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No project data available for this period
          </div>
        ) : (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="chart">Donut Chart</TabsTrigger>
              <TabsTrigger value="list">Bar List</TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              <DonutChart
                className="h-80"
                data={donutData}
                category="value"
                index="name"
                valueFormatter={(value) => `${value.toFixed(1)}h`}
                colors={["blue", "cyan", "indigo", "violet", "purple", "fuchsia", "pink", "rose"]}
                showLabel={true}
              />
            </TabsContent>

            <TabsContent value="list">
              <div className="space-y-4">
                <BarList
                  data={barListData}
                  valueFormatter={(value) => `${value.toFixed(1)}h`}
                  showAnimation={true}
                />

                {/* Detailed breakdown table */}
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Detailed Breakdown</h4>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 font-medium text-sm">
                      <div>Project</div>
                      <div className="text-right">Hours</div>
                      <div className="text-right">Sessions</div>
                      <div className="text-right">Percentage</div>
                    </div>
                    {data.projects.map((project, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-4 p-3 border-t text-sm"
                      >
                        <div className="font-medium truncate">{project.projectName}</div>
                        <div className="text-right">{project.totalHours.toFixed(1)}h</div>
                        <div className="text-right">{project.sessionCount}</div>
                        <div className="text-right">{project.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
