/**
 * Date utility functions for formatting and manipulation
 * Used throughout the project detail page
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInDays,
  startOfDay,
  subDays,
  isSameDay,
} from 'date-fns'

/**
 * Format a date as relative time
 * Examples: "Today", "Yesterday", "3 days ago", "Oct 25, 2025"
 */
export function formatRelativeDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const today = startOfDay(new Date())

  if (isToday(parsedDate)) {
    return 'Today'
  }

  if (isYesterday(parsedDate)) {
    return 'Yesterday'
  }

  const diffDays = differenceInDays(today, startOfDay(parsedDate))

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  return format(parsedDate, 'MMM d, yyyy')
}

/**
 * Format a date key for grouping (YYYY-MM-DD)
 */
export function getDateKey(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  return format(parsedDate, 'yyyy-MM-dd')
}

/**
 * Format a time range from start and end times
 * Example: "9:00 AM - 12:30 PM"
 */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = typeof end === 'string' ? new Date(end) : end

  return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`
}

/**
 * Format relative time (how long ago)
 * Examples: "2 hours ago", "5 minutes ago", "Just now"
 */
export function formatRelativeTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - parsedDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) {
    return 'Just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays === 1) {
    return 'Yesterday'
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`
  }

  return format(parsedDate, 'MMM d, yyyy')
}

/**
 * Format duration in hours (with 1-2 decimal places)
 */
export function formatDuration(durationInSeconds: number): string {
  const hours = durationInSeconds / 3600

  if (hours < 0.1) {
    const minutes = Math.round(durationInSeconds / 60)
    return `${minutes} min`
  }

  return `${hours.toFixed(hours < 10 ? 1 : 0)} hrs`
}

/**
 * Format day of week with date
 * Example: "Monday - Nov 5, 2025"
 */
export function formatDayWithDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  return format(parsedDate, 'EEEE - MMM d, yyyy')
}

/**
 * Check if two dates are on the same day
 */
export function areSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return isSameDay(d1, d2)
}

/**
 * Get date N days ago
 */
export function getDaysAgo(days: number): Date {
  return subDays(new Date(), days)
}
