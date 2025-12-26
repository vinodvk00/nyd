"use client"

import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RunningTimer {
  id: number;
  description: string;
  duration: number; // seconds
  projectName?: string;
  start: string;
}

async function fetchRunningTimer(): Promise<RunningTimer | null> {
  const response = await fetch(`${API_URL}/tracks/toggl/current`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // No timer running
    }
    if (response.status === 401) {
      return null; // Not authenticated, silently fail
    }
    throw new Error('Failed to fetch running timer');
  }

  return response.json();
}

export function useRunningTimer() {
  return useSWR<RunningTimer | null>(
    '/tracks/toggl/current',
    fetchRunningTimer,
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false, // Don't retry on auth errors
    }
  );
}
