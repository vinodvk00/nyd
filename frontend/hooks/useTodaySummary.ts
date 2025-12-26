"use client"

import useSWR from 'swr';
import { fetchSummaryStats } from '@/lib/api';
import type { SummaryStats } from '@/types/analytics';

export function useTodaySummary() {
  const { data, error, mutate } = useSWR<SummaryStats>(
    ['/tracks/stats/summary', 'today'],
    () => fetchSummaryStats('today'),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    error,
    loading: !data && !error,
    mutate,
  };
}
