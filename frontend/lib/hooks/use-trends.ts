"use client"

import useSWR from 'swr';
import { fetchTrends } from '@/lib/api';
import { getDateRangeFromPeriod } from '@/lib/utils/date-utils';
import type { Trend, TrendMetric, TimePeriod, CustomDateRange } from '@/types/analytics';

interface UseTrendsResult {
  data: Trend | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch trend data (period-over-period comparison) with SWR caching
 * @param metric - Metric to compare (hours or sessions)
 * @param period - Time period (today, week, month, all, custom)
 * @param customRange - Optional custom date range for 'custom' period
 * @returns Trend data, loading state, error, and refetch function
 */
export function useTrends(
  metric: TrendMetric = 'hours',
  period: TimePeriod = 'week',
  customRange?: CustomDateRange
): UseTrendsResult {
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
    ['trends', metric, effectivePeriod, startDate, endDate],
    () => fetchTrends(metric, effectivePeriod, startDate, endDate),
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
