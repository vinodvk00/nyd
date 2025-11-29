export enum ProgressStatus {
  AHEAD = 'ahead',
  ON_TRACK = 'on-track',
  BEHIND = 'behind',
  NEGLECTED = 'neglected',
  CRITICAL = 'critical',
}

export class GoalProgressDto {
  goalId: number;
  goalName: string;
  targetHours: number;
  targetPeriod: 'daily' | 'weekly' | 'monthly';
  actualHours: number;
  progressPercentage: number;
  status: ProgressStatus;
  remainingHours: number;
  tags: string[];
  matchedTracksCount: number;
}
