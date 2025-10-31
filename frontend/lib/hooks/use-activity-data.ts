"use client"

import { useState, useEffect } from 'react';
import { fetchActivityData } from '@/lib/api';
import type { ActivityData, GroupBy } from '@/types/analytics';

interface UseActivityDataResult {
  data: ActivityData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch activity timeline data
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param groupBy - Grouping (day, week, month)
 * @returns Activity data, loading state, error, and refetch function
 */
export function useActivityData(
  startDate?: string,
  endDate?: string,
  groupBy: GroupBy = 'day'
): UseActivityDataResult {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchActivityData(startDate, endDate, groupBy);
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
  }, [startDate, endDate, groupBy]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
