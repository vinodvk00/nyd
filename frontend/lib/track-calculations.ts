/**
 * Utility functions for track calculations
 * Used in project detail page for metrics and analytics
 */

import { Track, ProjectStats, DateGroupedTracks } from '@/types/analytics'

/**
 * Calculate total hours from an array of tracks
 */
export function calculateTotalHours(tracks: Track[]): number {
  return tracks.reduce((sum, track) => {
    return sum + (track.duration / 3600) // Convert seconds to hours
  }, 0)
}

/**
 * Calculate average session duration
 */
export function calculateAverageSession(tracks: Track[]): number {
  if (tracks.length === 0) return 0
  const totalHours = calculateTotalHours(tracks)
  return totalHours / tracks.length
}

/**
 * Get the most recent activity timestamp
 */
export function getLastActivity(tracks: Track[]): Date | null {
  if (tracks.length === 0) return null

  const timestamps = tracks.map(track => new Date(track.start).getTime())
  const maxTimestamp = Math.max(...timestamps)

  return new Date(maxTimestamp)
}

/**
 * Calculate project stats from tracks
 */
export function calculateProjectStats(tracks: Track[]): ProjectStats {
  return {
    totalHours: calculateTotalHours(tracks),
    sessionCount: tracks.length,
    averageSessionDuration: calculateAverageSession(tracks),
    lastActivity: getLastActivity(tracks),
  }
}

/**
 * Get longest session from tracks
 */
export function getLongestSession(tracks: Track[]): Track | null {
  if (tracks.length === 0) return null

  return tracks.reduce((longest, track) => {
    return track.duration > longest.duration ? track : longest
  })
}

/**
 * Get shortest session from tracks
 */
export function getShortestSession(tracks: Track[]): Track | null {
  if (tracks.length === 0) return null

  return tracks.reduce((shortest, track) => {
    return track.duration < shortest.duration ? track : shortest
  })
}

/**
 * Filter tracks by date range
 */
export function filterByDateRange(
  tracks: Track[],
  startDate: Date,
  endDate: Date
): Track[] {
  return tracks.filter(track => {
    const trackDate = new Date(track.start)
    return trackDate >= startDate && trackDate <= endDate
  })
}

/**
 * Calculate percentage change (trend)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Group tracks by date (YYYY-MM-DD format)
 */
export function groupTracksByDate(tracks: Track[]): DateGroupedTracks {
  return tracks.reduce((acc, track) => {
    const date = new Date(track.start)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!acc[dateKey]) {
      acc[dateKey] = []
    }

    acc[dateKey].push(track)
    return acc
  }, {} as DateGroupedTracks)
}

/**
 * Sort tracks by start time (most recent first)
 */
export function sortTracksByRecent(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    return new Date(b.start).getTime() - new Date(a.start).getTime()
  })
}

/**
 * Calculate end time for a track
 */
export function calculateEndTime(track: Track): Date {
  const startTime = new Date(track.start)
  return new Date(startTime.getTime() + track.duration * 1000)
}

/**
 * Group tracks by task description and calculate total hours
 * Returns sorted by most hours to least
 */
export function getTaskDistribution(tracks: Track[]): Array<{ name: string; hours: number; value: number }> {
  const taskMap = tracks.reduce((acc, track) => {
    const taskName = track.description || 'No description'
    const hours = track.duration / 3600

    if (!acc[taskName]) {
      acc[taskName] = 0
    }
    acc[taskName] += hours

    return acc
  }, {} as Record<string, number>)

  // Convert to array and sort by hours (descending)
  return Object.entries(taskMap)
    .map(([name, hours]) => ({
      name,
      hours: parseFloat(hours.toFixed(1)),
      value: parseFloat(hours.toFixed(1))
    }))
    .sort((a, b) => b.hours - a.hours)
}

/**
 * Get this week's stats (last 7 days)
 * Returns total hours and trend vs previous 7 days
 */
export function getThisWeekStats(tracks: Track[]): {
  thisWeekHours: number
  trend: number
} {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const thisWeekTracks = filterByDateRange(tracks, sevenDaysAgo, now)
  const lastWeekTracks = filterByDateRange(tracks, fourteenDaysAgo, sevenDaysAgo)

  const thisWeekHours = calculateTotalHours(thisWeekTracks)
  const lastWeekHours = calculateTotalHours(lastWeekTracks)
  const trend = calculateTrend(thisWeekHours, lastWeekHours)

  return { thisWeekHours, trend }
}

/**
 * Get work patterns: most productive time block and busiest day
 */
export function getWorkPatterns(tracks: Track[]): {
  mostProductiveTime: string
  mostProductiveTimeHours: number
  busiestDay: string
  busiestDayHours: number
  avgSessionHours: number
} {
  // Time blocks
  const timeBlocks = {
    'Morning (6am-12pm)': 0,
    'Afternoon (12pm-6pm)': 0,
    'Evening (6pm-12am)': 0,
    'Night (12am-6am)': 0,
  }

  // Days of week
  const daysOfWeek = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
  }

  tracks.forEach(track => {
    const date = new Date(track.start)
    const hour = date.getHours()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }) as keyof typeof daysOfWeek
    const hours = track.duration / 3600

    // Time block
    if (hour >= 6 && hour < 12) timeBlocks['Morning (6am-12pm)'] += hours
    else if (hour >= 12 && hour < 18) timeBlocks['Afternoon (12pm-6pm)'] += hours
    else if (hour >= 18 && hour < 24) timeBlocks['Evening (6pm-12am)'] += hours
    else timeBlocks['Night (12am-6am)'] += hours

    // Day of week
    daysOfWeek[dayName] += hours
  })

  // Find most productive time
  const mostProductiveTimeEntry = Object.entries(timeBlocks).reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  )

  // Find busiest day
  const busiestDayEntry = Object.entries(daysOfWeek).reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  )

  return {
    mostProductiveTime: mostProductiveTimeEntry[0],
    mostProductiveTimeHours: parseFloat(mostProductiveTimeEntry[1].toFixed(1)),
    busiestDay: busiestDayEntry[0],
    busiestDayHours: parseFloat(busiestDayEntry[1].toFixed(1)),
    avgSessionHours: parseFloat(calculateAverageSession(tracks).toFixed(1)),
  }
}

/**
 * Calculate median session duration in hours
 */
export function getMedianSession(tracks: Track[]): number {
  if (tracks.length === 0) return 0

  const durations = tracks.map(t => t.duration / 3600).sort((a, b) => a - b)
  const mid = Math.floor(durations.length / 2)

  if (durations.length % 2 === 0) {
    return (durations[mid - 1] + durations[mid]) / 2
  }

  return durations[mid]
}

/**
 * Get recent 7 days breakdown with daily hours
 */
export function getRecentDaysBreakdown(tracks: Track[]): Array<{
  date: string
  dayName: string
  hours: number
}> {
  const now = new Date()
  const result = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateKey = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

    const dayTracks = tracks.filter(track => {
      const trackDate = new Date(track.start).toISOString().split('T')[0]
      return trackDate === dateKey
    })

    const hours = calculateTotalHours(dayTracks)

    result.push({
      date: dateKey,
      dayName,
      hours: parseFloat(hours.toFixed(1))
    })
  }

  return result
}
