/**
 * Central Timezone Configuration
 * All date/time operations in the app should use these utilities
 */

// Default timezone - currently uses browser's local timezone
// In the future, this can be made configurable per user
export const APP_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Get the current timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Get timezone display name (e.g., "Asia/Kolkata", "America/New_York")
 */
export function getTimezoneName(): string {
  return APP_TIMEZONE;
}

/**
 * Get formatted timezone offset string (e.g., "UTC+5:30", "UTC-5:00")
 */
export function getTimezoneOffsetString(): string {
  const offset = -getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get start of day in local timezone as ISO string
 * @param dateStr - Date string in YYYY-MM-DD format
 */
export function getStartOfDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Get end of day in local timezone as ISO string
 * @param dateStr - Date string in YYYY-MM-DD format
 */
export function getEndOfDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return date.toISOString();
}

/**
 * Get start of next day in local timezone as ISO string
 * @param dateStr - Date string in YYYY-MM-DD format
 */
export function getStartOfNextDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Convert a date to YYYY-MM-DD format in local timezone
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for display with timezone consideration
 */
export function formatDateTime(isoString: string, format: 'time' | 'date' | 'datetime' = 'datetime'): string {
  const date = new Date(isoString);

  switch (format) {
    case 'time':
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    case 'date':
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'datetime':
    default:
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
  }
}
