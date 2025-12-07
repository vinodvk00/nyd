export enum GoalPriority {
  CRITICAL = "critical",
  IMPORTANT = "important",
  GROWTH = "growth",
  HOBBY = "hobby",
}

export enum TargetPeriod {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

export enum ProgressStatus {
  AHEAD = "ahead",
  ON_TRACK = "on-track",
  BEHIND = "behind",
  NEGLECTED = "neglected",
  CRITICAL = "critical",
}

export interface GoalProgress {
  goalId: number;
  goalName: string;
  targetHours: number;
  targetPeriod: TargetPeriod;
  actualHours: number;
  progressPercentage: number;
  status: ProgressStatus;
  remainingHours: number;
  tags: string[];
  matchedTracksCount: number;
}

export interface Area {
  id: number;
  name: string;
  icon?: string;
  order: number;
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  order: number;
  areaId: number;
  area?: Area;
  goals?: Goal[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: number;
  name: string;
  purpose?: string;
  priority: GoalPriority;
  targetHours: number;
  targetPeriod: TargetPeriod;
  minimumDaily?: number;
  startDate?: string;
  deadline?: string;
  tags: string[];
  isActive: boolean;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaDto {
  name: string;
  icon?: string;
  order?: number;
}

export interface UpdateAreaDto {
  name?: string;
  icon?: string;
  order?: number;
}

export interface CreateCategoryDto {
  name: string;
  areaId: number;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  areaId?: number;
  order?: number;
}

export interface CreateGoalDto {
  name: string;
  purpose?: string;
  priority?: GoalPriority;
  targetHours: number;
  targetPeriod?: TargetPeriod;
  minimumDaily?: number;
  startDate?: string;
  deadline?: string;
  tags: string[];
  categoryId: number;
  isActive?: boolean;
}

export interface UpdateGoalDto {
  name?: string;
  purpose?: string;
  priority?: GoalPriority;
  targetHours?: number;
  targetPeriod?: TargetPeriod;
  minimumDaily?: number;
  startDate?: string;
  deadline?: string;
  tags?: string[];
  categoryId?: number;
  isActive?: boolean;
}
