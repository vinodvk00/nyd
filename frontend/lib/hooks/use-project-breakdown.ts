"use client"

import useSWR from 'swr';
import { fetchProjectBreakdown } from '@/lib/api';
import { getDateRangeFromPeriod } from '@/lib/utils/date-utils';
import type { ProjectBreakdown, TimePeriod, CustomDateRange } from '@/types/analytics';

interface UseProjectBreakdownResult {
  data: ProjectBreakdown | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch project breakdown data with SWR caching
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param period - Time period (today, week, month, all, custom)
 * @param customRange - Optional custom date range for 'custom' period
 * @returns Project breakdown data, loading state, error, and refetch function
 */
export function useProjectBreakdown(
  startDate?: string,
  endDate?: string,
  period?: TimePeriod,
  customRange?: CustomDateRange
): UseProjectBreakdownResult {
  let finalStartDate = startDate;
  let finalEndDate = endDate;

  if (period && !startDate && !endDate) {
    const range = getDateRangeFromPeriod(period, customRange);
    finalStartDate = range.startDate;
    finalEndDate = range.endDate;
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['project-breakdown', finalStartDate, finalEndDate, period],
    () => fetchProjectBreakdown(finalStartDate, finalEndDate),
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
