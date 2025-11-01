"use client"

import { useState, useEffect } from 'react';
import { fetchHourlyPattern } from '@/lib/api';
import type { HourlyPattern, TimePeriod } from '@/types/analytics';

interface UseHourlyPatternResult {
  data: HourlyPattern | null;
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
 * Hook to fetch hourly activity pattern
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
  const [data, setData] = useState<HourlyPattern | null>(null);
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

      const result = await fetchHourlyPattern(finalStartDate, finalEndDate);
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
  }, [startDate, endDate, period]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
