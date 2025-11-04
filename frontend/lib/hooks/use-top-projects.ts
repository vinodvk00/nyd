"use client"

import useSWR from 'swr';
import { fetchTopProjects } from '@/lib/api';
import type { TopProjects, TimePeriod } from '@/types/analytics';

interface UseTopProjectsResult {
  data: TopProjects | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch top projects by time spent with SWR caching
 * @param limit - Number of projects to return (default: 5)
 * @param period - Time period (today, week, month, all)
 * @returns Top projects data, loading state, error, and refetch function
 */
export function useTopProjects(
  limit: number = 5,
  period: TimePeriod = 'month'
): UseTopProjectsResult {
  const { data, error, isLoading, mutate } = useSWR(
    ['top-projects', limit, period],
    () => fetchTopProjects(limit, period),
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
