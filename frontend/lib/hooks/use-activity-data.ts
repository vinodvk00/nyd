"use client"

import useSWR from 'swr';
import { fetchActivityData } from '@/lib/api';
import { getDateRangeFromPeriod } from '@/lib/utils/date-utils';
import type { ActivityData, GroupBy, TimePeriod } from '@/types/analytics';

interface UseActivityDataResult {
  data: ActivityData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch activity timeline data with SWR caching
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param groupBy - Grouping (day, week, month)
 * @param period - Time period (today, week, month, all)
 * @returns Activity data, loading state, error, and refetch function
 */
export function useActivityData(
  startDate?: string,
  endDate?: string,
  groupBy: GroupBy = 'day',
  period?: TimePeriod
): UseActivityDataResult {
  let finalStartDate = startDate;
  let finalEndDate = endDate;

  if (period && !startDate && !endDate) {
    const range = getDateRangeFromPeriod(period);
    finalStartDate = range.startDate;
    finalEndDate = range.endDate;
  }

  const { data, error, isLoading, mutate } = useSWR(
    ['activity-data', finalStartDate, finalEndDate, groupBy, period],
    () => fetchActivityData(finalStartDate, finalEndDate, groupBy),
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
