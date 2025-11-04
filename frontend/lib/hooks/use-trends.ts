"use client"

import useSWR from 'swr';
import { fetchTrends } from '@/lib/api';
import type { Trend, TrendMetric, TimePeriod } from '@/types/analytics';

interface UseTrendsResult {
  data: Trend | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch trend data (period-over-period comparison) with SWR caching
 * @param metric - Metric to compare (hours or sessions)
 * @param period - Time period (today, week, month, all)
 * @returns Trend data, loading state, error, and refetch function
 */
export function useTrends(
  metric: TrendMetric = 'hours',
  period: TimePeriod = 'week'
): UseTrendsResult {
  const { data, error, isLoading, mutate } = useSWR(
    ['trends', metric, period],
    () => fetchTrends(metric, period),
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
