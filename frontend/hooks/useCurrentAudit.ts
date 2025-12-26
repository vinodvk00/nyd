"use client"

import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Audit {
  id: string;
  month: number;
  year: number;
  createdAt?: string;
  updatedAt?: string;
}

async function fetchAudits(): Promise<Audit[]> {
  const response = await fetch(`${API_URL}/audits`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      return [{
        id: `${currentYear}-${currentMonth}`,
        month: currentMonth,
        year: currentYear,
      }];
    }
    throw new Error('Failed to fetch audits');
  }

  return response.json();
}

export function useCurrentAudit() {
  const { data: audits, error } = useSWR<Audit[]>(
    `${API_URL}/audits`,
    fetchAudits,
    {
      revalidateOnFocus: true,
    }
  );

  const currentAudit = audits?.[0];

  return {
    data: currentAudit,
    audits,
    error,
    loading: !audits && !error,
  };
}
