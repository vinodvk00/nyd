"use client"

import useSWR from 'swr';
import { fetchDayTracks } from '@/lib/api';
import { getStartOfDay, getStartOfNextDay } from '@/lib/timezone';
import type { Track } from '@/types/analytics';

interface UseDayTracksResult {
  data: Track[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDayTracks(date: string | null): UseDayTracksResult {
  const startDate = date ? getStartOfDay(date) : null;
  const endDate = date ? getStartOfNextDay(date) : null;

  const { data, error, isLoading, mutate } = useSWR(
    date ? ['day-tracks', date] : null,
    () => startDate && endDate ? fetchDayTracks(startDate, endDate) : Promise.resolve([]),
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
