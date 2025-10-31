/**
 * TypeScript interfaces for Analytics API responses
 * These match the backend API schemas defined in backend/BACKEND_ANALYTICS_PLAN.md
 */

export type TimePeriod = 'today' | 'week' | 'month' | 'all';
export type GroupBy = 'day' | 'week' | 'month';
export type TrendMetric = 'hours' | 'sessions';
export type TrendDirection = 'up' | 'down' | 'stable';

// Summary Statistics
// GET /tracks/stats/summary?period={period}
export interface SummaryStats {
  totalHours: number;
  totalSessions: number;
  averageSessionDuration: number;
  activeProjects: number;
  period: TimePeriod;
}

// Project Breakdown
// GET /tracks/stats/by-project?startDate={date}&endDate={date}
export interface ProjectBreakdownItem {
  projectName: string;
  totalHours: number;
  sessionCount: number;
  percentage: number;
}

export interface ProjectBreakdown {
  projects: ProjectBreakdownItem[];
}

// Daily Activity
// GET /tracks/stats/by-date?startDate={date}&endDate={date}&groupBy={groupBy}
export interface ActivityDataPoint {
  date: string;
  totalHours: number;
  sessionCount: number;
}

export interface ActivityData {
  data: ActivityDataPoint[];
  groupBy: GroupBy;
}

// Hourly Pattern Analysis
// GET /tracks/stats/hourly-pattern?startDate={date}&endDate={date}
export interface HourlyDistributionItem {
  hour: number;
  totalHours: number;
  sessionCount: number;
}

export interface HourlyPattern {
  hourlyDistribution: HourlyDistributionItem[];
}

// Trends & Comparisons
// GET /tracks/stats/trends?metric={metric}&period={period}
export interface Trend {
  current: number;
  previous: number;
  change: number; // percentage
  trend: TrendDirection;
  metric: TrendMetric;
  period: TimePeriod;
}

// Top Projects
// GET /tracks/stats/top-projects?limit={limit}&period={period}
export interface TopProjectItem {
  projectId?: number;
  projectName: string;
  totalHours: number;
  rank: number;
}

export interface TopProjects {
  topProjects: TopProjectItem[];
  period: TimePeriod;
}

// API Error Response
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  stack?: string; 
}

// Generic API Response wrapper for error handling
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiError;
};
