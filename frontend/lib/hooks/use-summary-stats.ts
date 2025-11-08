"use client"

import useSWR from 'swr';
import { fetchSummaryStats } from '@/lib/api';
import { getDateRangeFromPeriod } from '@/lib/utils/date-utils';
import type { SummaryStats, TimePeriod, CustomDateRange } from '@/types/analytics';

interface UseSummaryStatsResult {
  data: SummaryStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch summary statistics with SWR caching
 * @param period - Time period (today, week, month, all, custom)
 * @param customRange - Optional custom date range for 'custom' period
 * @returns Summary stats data, loading state, error, and refetch function
 */
export function useSummaryStats(
  period: TimePeriod = 'month',
  customRange?: CustomDateRange
): UseSummaryStatsResult {
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
    ['summary-stats', effectivePeriod, startDate, endDate],
    () => fetchSummaryStats(effectivePeriod, startDate, endDate),
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
