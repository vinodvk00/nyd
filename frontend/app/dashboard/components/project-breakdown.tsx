"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarList } from "@tremor/react";
import { useProjectBreakdown } from "@/lib/hooks";
import type { TimePeriod, CustomDateRange } from "@/types/analytics";
import Link from "next/link";

interface ProjectBreakdownProps {
  startDate?: string;
  endDate?: string;
  period?: TimePeriod;
  customRange?: CustomDateRange;
}

export function ProjectBreakdown({
  startDate,
  endDate,
  period,
  customRange,
}: ProjectBreakdownProps) {
  const { data, loading, error } = useProjectBreakdown(
    startDate,
    endDate,
    period,
    customRange
  );

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
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
    );
  }

  const barListData = data.projects.map((project) => ({
    name: project.projectName,
    value: project.totalHours,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Breakdown</CardTitle>
        <CardDescription>Time distribution across projects</CardDescription>
      </CardHeader>
      <CardContent>
        {data.projects.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            No project data available for this period
          </div>
        ) : (
          <div className="space-y-4">
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
                    className="grid grid-cols-4 gap-4 p-3 border-t text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Link
                      href={`/projects/${encodeURIComponent(project.projectName)}`}
                      className="font-medium truncate hover:text-blue-600 hover:underline cursor-pointer"
                    >
                      {project.projectName}
                    </Link>
                    <div className="text-right">
                      {project.totalHours.toFixed(1)}h
                    </div>
                    <div className="text-right">{project.sessionCount}</div>
                    <div className="text-right">{project.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
