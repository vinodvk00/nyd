"use client"

import { useState, useEffect } from 'react';
import { fetchHourlyPattern } from '@/lib/api';
import type { HourlyPattern } from '@/types/analytics';

interface UseHourlyPatternResult {
  data: HourlyPattern | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch hourly activity pattern
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Hourly pattern data, loading state, error, and refetch function
 */
export function useHourlyPattern(
  startDate?: string,
  endDate?: string
): UseHourlyPatternResult {
  const [data, setData] = useState<HourlyPattern | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchHourlyPattern(startDate, endDate);
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
  }, [startDate, endDate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
