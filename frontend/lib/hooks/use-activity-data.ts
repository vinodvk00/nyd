"use client"

import { useState, useEffect } from 'react';
import { fetchActivityData } from '@/lib/api';
import type { ActivityData, GroupBy, TimePeriod } from '@/types/analytics';

interface UseActivityDataResult {
  data: ActivityData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Calculate date range from time period
 */
function getDateRangeFromPeriod(period?: TimePeriod): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'all':
      startDate.setFullYear(2000);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Hook to fetch activity timeline data
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
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let finalStartDate = startDate;
      let finalEndDate = endDate;

      if (period && !startDate && !endDate) {
        const range = getDateRangeFromPeriod(period);
        finalStartDate = range.startDate;
        finalEndDate = range.endDate;
      }

      const result = await fetchActivityData(finalStartDate, finalEndDate, groupBy);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, groupBy, period]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
