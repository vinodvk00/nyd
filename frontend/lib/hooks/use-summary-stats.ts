"use client"

import useSWR from 'swr';
import { fetchSummaryStats } from '@/lib/api';
import type { SummaryStats, TimePeriod } from '@/types/analytics';

interface UseSummaryStatsResult {
  data: SummaryStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch summary statistics with SWR caching
 * @param period - Time period (today, week, month, all)
 * @returns Summary stats data, loading state, error, and refetch function
 */
export function useSummaryStats(period: TimePeriod = 'month'): UseSummaryStatsResult {
  const { data, error, isLoading, mutate } = useSWR(
    ['summary-stats', period],
    () => fetchSummaryStats(period),
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
