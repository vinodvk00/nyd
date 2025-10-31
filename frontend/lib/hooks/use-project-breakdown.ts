"use client"

import { useState, useEffect } from 'react';
import { fetchProjectBreakdown } from '@/lib/api';
import type { ProjectBreakdown } from '@/types/analytics';

interface UseProjectBreakdownResult {
  data: ProjectBreakdown | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch project breakdown data
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Project breakdown data, loading state, error, and refetch function
 */
export function useProjectBreakdown(
  startDate?: string,
  endDate?: string
): UseProjectBreakdownResult {
  const [data, setData] = useState<ProjectBreakdown | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchProjectBreakdown(startDate, endDate);
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
