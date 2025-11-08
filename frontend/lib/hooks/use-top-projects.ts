"use client"

import useSWR from 'swr';
import { fetchTopProjects } from '@/lib/api';
import { getDateRangeFromPeriod } from '@/lib/utils/date-utils';
import type { TopProjects, TimePeriod, CustomDateRange } from '@/types/analytics';

interface UseTopProjectsResult {
  data: TopProjects | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch top projects by time spent with SWR caching
 * @param limit - Number of projects to return (default: 5)
 * @param period - Time period (today, week, month, all, custom)
 * @param customRange - Optional custom date range for 'custom' period
 * @returns Top projects data, loading state, error, and refetch function
 */
export function useTopProjects(
  limit: number = 5,
  period: TimePeriod = 'month',
  customRange?: CustomDateRange
): UseTopProjectsResult {
  let startDate: string | undefined;
  let endDate: string | undefined;
  let effectivePeriod: TimePeriod | undefined = period;

  if (period === 'custom' && customRange?.startDate && customRange?.endDate) {
    const range = getDateRangeFromPeriod(period, customRange);
    startDate = range.startDate;
    endDate = range.endDate;
    effectivePeriod = undefined;
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['top-projects', limit, effectivePeriod, startDate, endDate],
    () => fetchTopProjects(limit, effectivePeriod, startDate, endDate),
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ?? null,
    refetch: () => mutate(),
  };
}
