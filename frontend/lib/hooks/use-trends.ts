"use client"

import { useState, useEffect } from 'react';
import { fetchTrends } from '@/lib/api';
import type { Trend, TrendMetric, TimePeriod } from '@/types/analytics';

interface UseTrendsResult {
  data: Trend | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch trend data (period-over-period comparison)
 * @param metric - Metric to compare (hours or sessions)
 * @param period - Time period (today, week, month, all)
 * @returns Trend data, loading state, error, and refetch function
 */
export function useTrends(
  metric: TrendMetric = 'hours',
  period: TimePeriod = 'week'
): UseTrendsResult {
  const [data, setData] = useState<Trend | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchTrends(metric, period);
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
  }, [metric, period]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
