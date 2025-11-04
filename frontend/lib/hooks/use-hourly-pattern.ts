"use client"

import useSWR from 'swr';
import { fetchHourlyPattern } from '@/lib/api';
import { getDateRangeFromPeriod } from '@/lib/utils/date-utils';
import type { HourlyPattern, TimePeriod } from '@/types/analytics';

interface UseHourlyPatternResult {
  data: HourlyPattern | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch hourly activity pattern with SWR caching
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param period - Time period (today, week, month, all)
 * @returns Hourly pattern data, loading state, error, and refetch function
 */
export function useHourlyPattern(
  startDate?: string,
  endDate?: string,
  period?: TimePeriod
): UseHourlyPatternResult {
  let finalStartDate = startDate;
  let finalEndDate = endDate;

  if (period && !startDate && !endDate) {
    const range = getDateRangeFromPeriod(period);
    finalStartDate = range.startDate;
    finalEndDate = range.endDate;
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['hourly-pattern', finalStartDate, finalEndDate, period],
    () => fetchHourlyPattern(finalStartDate, finalEndDate),
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
