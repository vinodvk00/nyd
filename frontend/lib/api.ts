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
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

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

    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }

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
 * GET /tracks/stats/summary?period={period}&startDate={date}&endDate={date}
 */
export async function fetchSummaryStats(
  period?: TimePeriod,
  startDate?: string,
  endDate?: string
): Promise<SummaryStats> {
  const query = buildQueryString({ period, startDate, endDate });
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
 * GET /tracks/stats/trends?metric={metric}&period={period}&startDate={date}&endDate={date}
 */
export async function fetchTrends(
  metric: TrendMetric = 'hours',
  period?: TimePeriod,
  startDate?: string,
  endDate?: string
): Promise<Trend> {
  const query = buildQueryString({ metric, period, startDate, endDate });
  return fetchApi<Trend>(`/tracks/stats/trends${query}`);
}

/**
 * Get Top Projects
 * GET /tracks/stats/top-projects?limit={limit}&period={period}&startDate={date}&endDate={date}
 */
export async function fetchTopProjects(
  limit: number = 5,
  period?: TimePeriod,
  startDate?: string,
  endDate?: string
): Promise<TopProjects> {
  const query = buildQueryString({ limit, period, startDate, endDate });
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
 * Convert TimePeriod to date range
 * Returns startDate and endDate in YYYY-MM-DD format
 */
export function periodToDateRange(period: TimePeriod, customRange?: { startDate: Date | null; endDate: Date | null }): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'custom') {
    if (customRange?.startDate && customRange?.endDate) {
      return {
        startDate: formatDateForApi(customRange.startDate),
        endDate: formatDateForApi(customRange.endDate),
      };
    }

    return {};
  }

  switch (period) {
    case 'today':
      return {
        startDate: formatDateForApi(today),
        endDate: formatDateForApi(today),
      };

    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); 
      return {
        startDate: formatDateForApi(weekStart),
        endDate: formatDateForApi(today),
      };
    }

    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatDateForApi(monthStart),
        endDate: formatDateForApi(today),
      };
    }

    case 'all':
      // No date range for 'all'
      return {};

    default:
      return {};
  }
}

/**
 * Format Date object to YYYY-MM-DD string
 */
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name?: string;
  };
}

export interface User {
  id: number;
  email: string;
  name?: string;
}

/**
 * Login user
 * POST /auth/login
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Login failed',
    }));
    throw new Error(errorData.message || 'Login failed');
  }

  return response.json();
}

/**
 * Get current user profile
 * GET /auth/profile
 */
export async function getProfile(): Promise<User> {
  return fetchApi<User>('/auth/profile');
}

/**
 * Logout user (client-side only)
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
