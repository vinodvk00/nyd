export interface Audit {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: 'active' | 'completed' | 'abandoned';
  goal?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  stats?: {
    totalEntriesLogged: number;
    hoursLogged: number;
    completionPercentage: number;
    totalExpectedHours: number;
  };
}

export interface TimeEntry {
  id: string;
  auditId: string;
  date: string;
  hourSlot: number;
  startMinute: number;
  activityDescription: string;
  durationMinutes: number;
  isImportant: boolean;
  isUrgent: boolean;
  templateId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  template?: ActivityTemplate;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  description?: string;
  isImportant: boolean;
  isUrgent: boolean;
  category?: string;
  icon?: string;
  isDefault: boolean;
}

export interface DayEntries {
  date: string;
  entries: TimeEntry[];
  totalMinutesLogged: number;
  missingHours: number[];
}

export type Quadrant = 1 | 2 | 3 | 4;

export function getQuadrant(isImportant: boolean, isUrgent: boolean): Quadrant {
  if (isImportant && isUrgent) return 1;
  if (isImportant && !isUrgent) return 2;
  if (!isImportant && isUrgent) return 3;
  return 4;
}

export const QUADRANT_INFO = {
  1: { label: 'Q1: Crisis/Deadline', color: 'red', description: 'Important + Urgent' },
  2: { label: 'Q2: Deep Work', color: 'blue', description: 'Important + Not Urgent' },
  3: { label: 'Q3: Interruption', color: 'yellow', description: 'Not Important + Urgent' },
  4: { label: 'Q4: Waste', color: 'gray', description: 'Not Important + Not Urgent' },
};

export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function getEntryStartTime(entry: TimeEntry): string {
  return formatTime(entry.hourSlot, entry.startMinute || 0);
}

export function getEntryEndTime(entry: TimeEntry): string {
  const totalMinutes = entry.hourSlot * 60 + (entry.startMinute || 0) + entry.durationMinutes;
  const endHour = Math.floor(totalMinutes / 60);
  const endMinute = totalMinutes % 60;
  return formatTime(endHour, endMinute);
}

export function getEntryTimeRange(entry: TimeEntry): string {
  return `${getEntryStartTime(entry)} - ${getEntryEndTime(entry)}`;
}
