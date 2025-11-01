/**
 * API Client for Analytics Backend
 * Provides typed fetch wrappers for all analytics endpoints
 */

import type {
  SummaryStats,
  ProjectBreakdown,
  ActivityData,
  HourlyPattern,
  Trend,
  TopProjects,
  TimePeriod,
  GroupBy,
  TrendMetric,
} from '@/types/analytics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An error occurred',
      }));

      throw new Error(
        errorData.message || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * Build query string from object
 */
function buildQueryString(params: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);

  return filtered.length > 0 ? `?${filtered.join('&')}` : '';
}

// ============================================================================
// Analytics API Functions
// ============================================================================

/**
 * Get Summary Statistics
 * GET /tracks/stats/summary?period={period}
 */
export async function fetchSummaryStats(
  period: TimePeriod = 'month'
): Promise<SummaryStats> {
  const query = buildQueryString({ period });
  return fetchApi<SummaryStats>(`/tracks/stats/summary${query}`);
}

/**
 * Get Project Breakdown
 * GET /tracks/stats/by-project?startDate={date}&endDate={date}
 */
export async function fetchProjectBreakdown(
  startDate?: string,
  endDate?: string
): Promise<ProjectBreakdown> {
  const query = buildQueryString({ startDate, endDate });
  return fetchApi<ProjectBreakdown>(`/tracks/stats/by-project${query}`);
}

/**
 * Get Activity Data (Daily/Weekly/Monthly)
 * GET /tracks/stats/by-date?startDate={date}&endDate={date}&groupBy={groupBy}
 */
export async function fetchActivityData(
  startDate?: string,
  endDate?: string,
  groupBy: GroupBy = 'day'
): Promise<ActivityData> {
  const query = buildQueryString({ startDate, endDate, groupBy });
  return fetchApi<ActivityData>(`/tracks/stats/by-date${query}`);
}

/**
 * Get Hourly Pattern
 * GET /tracks/stats/hourly-pattern?startDate={date}&endDate={date}
 */
export async function fetchHourlyPattern(
  startDate?: string,
  endDate?: string
): Promise<HourlyPattern> {
  const query = buildQueryString({ startDate, endDate });
  return fetchApi<HourlyPattern>(`/tracks/stats/hourly-pattern${query}`);
}

/**
 * Get Trends
 * GET /tracks/stats/trends?metric={metric}&period={period}
 */
export async function fetchTrends(
  metric: TrendMetric = 'hours',
  period: TimePeriod = 'week'
): Promise<Trend> {
  const query = buildQueryString({ metric, period });
  return fetchApi<Trend>(`/tracks/stats/trends${query}`);
}

/**
 * Get Top Projects
 * GET /tracks/stats/top-projects?limit={limit}&period={period}
 */
export async function fetchTopProjects(
  limit: number = 5,
  period: TimePeriod = 'month'
): Promise<TopProjects> {
  const query = buildQueryString({ limit, period });
  return fetchApi<TopProjects>(`/tracks/stats/top-projects${query}`);
}

// ============================================================================
// Sync Functions
// ============================================================================

/**
 * Trigger sync from Toggl to PostgreSQL
 * POST /tracks/sync?startDate={date}&endDate={date}
 */
export async function syncFromToggl(
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  message: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  errors?: Array<{ entryId: any; error: string }>;
}> {
  const query = buildQueryString({ startDate, endDate });
  return fetchApi(`/tracks/sync${query}`, {
    method: 'POST',
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current API URL (useful for debugging)
 */
export function getApiUrl(): string {
  return API_URL;
}

/**
 * Check if API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/tracks/stats/summary?period=today`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}
