import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { Track } from '../../tracks/entities/track.entity';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { UpdateGoalDto } from '../dto/update-goal.dto';
import { GoalProgressDto, ProgressStatus } from '../dto/goal-progress.dto';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async create(createGoalDto: CreateGoalDto): Promise<Goal> {
    const goal = this.goalRepository.create(createGoalDto);
    return this.goalRepository.save(goal);
  }

  async findAll(filters?: {
    isActive?: boolean;
    priority?: string;
    categoryId?: number;
    areaId?: number;
  }): Promise<Goal[]> {
    const queryBuilder = this.goalRepository
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.category', 'category')
      .leftJoinAndSelect('category.area', 'area');

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('goal.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.priority) {
      queryBuilder.andWhere('goal.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters?.categoryId) {
      queryBuilder.andWhere('goal.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.areaId) {
      queryBuilder.andWhere('category.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    return queryBuilder.getMany();
  }

  async findByCategory(categoryId: number): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { categoryId },
      relations: ['category'],
    });
  }

  async findOne(id: number): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id },
      relations: ['category', 'category.area'],
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    return goal;
  }

  async update(id: number, updateGoalDto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.findOne(id);
    Object.assign(goal, updateGoalDto);
    return this.goalRepository.save(goal);
  }

  async remove(id: number): Promise<void> {
    const goal = await this.findOne(id);
    await this.goalRepository.remove(goal);
  }

  /**
   * Get all active goals for progress tracking
   */
  async findActiveGoals(): Promise<Goal[]> {
    return this.findAll({ isActive: true });
  }

  /**
   * Calculate progress for a single goal based on tracked time
   */
  async calculateGoalProgress(goalId: number): Promise<GoalProgressDto> {
    const goal = await this.findOne(goalId);

    // Determine date range based on target period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (goal.targetPeriod) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        // Default to monthly if target period is invalid
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Find all tracks that match any of the goal's tags
    const tracks = await this.trackRepository
      .createQueryBuilder('track')
      .where('track.start >= :startDate', { startDate })
      .andWhere('track.start <= :endDate', { endDate })
      .andWhere('track.duration IS NOT NULL')
      .getMany();

    // Filter tracks that have tags matching the goal's tags
    const matchedTracks = tracks.filter((track) => {
      // Track tags are stored in description, we need to check if any goal tag appears
      // This is a simple implementation - you might want to use actual tag fields if available
      if (!track.description) return false;
      return goal.tags.some((goalTag) =>
        track.description.toLowerCase().includes(goalTag.toLowerCase()),
      );
    });

    // Calculate actual hours
    const totalSeconds = matchedTracks.reduce(
      (sum, track) => sum + (track.duration || 0),
      0,
    );
    const actualHours = parseFloat((totalSeconds / 3600).toFixed(2));

    // Calculate progress percentage
    const progressPercentage = Math.min(
      100,
      parseFloat(((actualHours / goal.targetHours) * 100).toFixed(1)),
    );

    // Determine status
    let status: ProgressStatus;
    if (progressPercentage >= 100) {
      status = ProgressStatus.AHEAD;
    } else if (progressPercentage >= 80) {
      status = ProgressStatus.ON_TRACK;
    } else if (progressPercentage >= 50) {
      status = ProgressStatus.BEHIND;
    } else if (progressPercentage >= 20) {
      status = ProgressStatus.NEGLECTED;
    } else {
      status = ProgressStatus.CRITICAL;
    }

    const remainingHours = Math.max(
      0,
      parseFloat((goal.targetHours - actualHours).toFixed(2)),
    );

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetHours: goal.targetHours,
      targetPeriod: goal.targetPeriod,
      actualHours,
      progressPercentage,
      status,
      remainingHours,
      tags: goal.tags,
      matchedTracksCount: matchedTracks.length,
    };
  }

  /**
   * Calculate progress for all active goals
   */
  async calculateAllGoalsProgress(): Promise<GoalProgressDto[]> {
    const activeGoals = await this.findActiveGoals();
    const progressPromises = activeGoals.map((goal) =>
      this.calculateGoalProgress(goal.id),
    );
    return Promise.all(progressPromises);
  }
}
