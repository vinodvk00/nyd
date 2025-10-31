"use client"

import { useState, useEffect } from 'react';
import { fetchTopProjects } from '@/lib/api';
import type { TopProjects, TimePeriod } from '@/types/analytics';

interface UseTopProjectsResult {
  data: TopProjects | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch top projects by time spent
 * @param limit - Number of projects to return (default: 5)
 * @param period - Time period (today, week, month, all)
 * @returns Top projects data, loading state, error, and refetch function
 */
export function useTopProjects(
  limit: number = 5,
  period: TimePeriod = 'month'
): UseTopProjectsResult {
  const [data, setData] = useState<TopProjects | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchTopProjects(limit, period);
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
  }, [limit, period]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
