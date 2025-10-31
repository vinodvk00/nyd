"use client"

import { useState, useEffect } from 'react';
import { fetchSummaryStats } from '@/lib/api';
import type { SummaryStats, TimePeriod } from '@/types/analytics';

interface UseSummaryStatsResult {
  data: SummaryStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch summary statistics
 * @param period - Time period (today, week, month, all)
 * @returns Summary stats data, loading state, error, and refetch function
 */
export function useSummaryStats(period: TimePeriod = 'month'): UseSummaryStatsResult {
  const [data, setData] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSummaryStats(period);
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
  }, [period]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
