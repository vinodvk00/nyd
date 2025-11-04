"use client"

import type { TimePeriod } from '@/types/analytics';

/**
 * Convert Date to local date string (YYYY-MM-DD)
 * Avoids timezone issues by using local date components
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate date range from time period using local timezone
 * @param period - Time period (today, week, month, all)
 * @returns Date range with start and end dates in YYYY-MM-DD format
 */
export function getDateRangeFromPeriod(period?: TimePeriod): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      // For today, start and end are the same date
      // Backend will handle setting to beginning/end of day
      break;
    case 'week':
      // Last 7 days
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      // Last 30 days
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'all':
      // Far back enough for all records
      startDate.setFullYear(2000);
      break;
    default:
      // Default to 30 days if no period specified
      startDate.setDate(startDate.getDate() - 30);
  }

  return {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate),
  };
}
