import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Track } from './entities/track.entity';

export enum TimePeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  ALL = 'all',
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum TrendMetric {
  HOURS = 'hours',
  SESSIONS = 'sessions',
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  /**
   * Get date range based on period
   */
  private getDateRange(period: TimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case TimePeriod.TODAY:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999); // Set to end of today
        break;
      case TimePeriod.WEEK:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case TimePeriod.MONTH:
        startDate.setDate(startDate.getDate() - 30);
        break;
      case TimePeriod.ALL:
        startDate.setFullYear(2000); // Far back enough for all records
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Validate and parse date strings
   */
  validateDateRange(
    startDate?: string,
    endDate?: string,
  ): {
    startDate: Date;
    endDate: Date;
  } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days back

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    if (start > end) {
      throw new Error('Start date must be before end date');
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }

  /**
   * Convert duration from seconds to hours
   */
  private secondsToHours(seconds: number): number {
    return Math.round((seconds / 3600) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(
    period?: TimePeriod,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    let startDate: Date, endDate: Date;

    if (startDateStr && endDateStr) {
      const range = this.validateDateRange(startDateStr, endDateStr);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      const range = this.getDateRange(period || TimePeriod.MONTH);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const tracks = await this.trackRepository.find({
      where: {
        start: Between(startDate, endDate),
      },
    });

    const totalSeconds = tracks.reduce(
      (sum, track) => sum + (track.duration || 0),
      0,
    );
    const totalHours = this.secondsToHours(totalSeconds);
    const totalSessions = tracks.length;
    const averageSessionDuration =
      totalSessions > 0 ? totalHours / totalSessions : 0;

    const uniqueProjects = new Set(
      tracks.map((t) => t.projectName).filter(Boolean),
    );

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      activeProjects: uniqueProjects.size,
      period: period || 'custom',
    };
  }

  /**
   * Get time breakdown by project
   */
  async getProjectBreakdown(startDate?: string, endDate?: string) {
    const { startDate: start, endDate: end } = this.validateDateRange(
      startDate,
      endDate,
    );

    const result = await this.trackRepository
      .createQueryBuilder('track')
      .select('track.projectName', 'projectName')
      .addSelect('SUM(track.duration)', 'totalSeconds')
      .addSelect('COUNT(track.id)', 'sessionCount')
      .where('track.start BETWEEN :start AND :end', { start, end })
      .andWhere('track.projectName IS NOT NULL')
      .groupBy('track.projectName')
      .getRawMany();

    const totalSeconds = result.reduce(
      (sum, r) => sum + parseFloat(r.totalSeconds || 0),
      0,
    );

    const projects = result.map((r) => ({
      projectName: r.projectName,
      totalHours: this.secondsToHours(parseFloat(r.totalSeconds || 0)),
      sessionCount: parseInt(r.sessionCount, 10),
      percentage:
        totalSeconds > 0
          ? Math.round((parseFloat(r.totalSeconds || 0) / totalSeconds) * 100)
          : 0,
    }));

    return {
      projects: projects.sort((a, b) => b.totalHours - a.totalHours),
    };
  }

  /**
   * Get activity grouped by date
   */
  async getActivityByDate(
    startDate?: string,
    endDate?: string,
    groupBy: GroupBy = GroupBy.DAY,
  ) {
    const { startDate: start, endDate: end } = this.validateDateRange(
      startDate,
      endDate,
    );

    let dateFormat: string;
    switch (groupBy) {
      case GroupBy.DAY:
        dateFormat = 'YYYY-MM-DD';
        break;
      case GroupBy.WEEK:
        dateFormat = 'YYYY-IW'; // ISO week
        break;
      case GroupBy.MONTH:
        dateFormat = 'YYYY-MM';
        break;
    }

    const result = await this.trackRepository
      .createQueryBuilder('track')
      .select(`TO_CHAR(track.start, '${dateFormat}')`, 'date')
      .addSelect('SUM(track.duration)', 'totalSeconds')
      .addSelect('COUNT(track.id)', 'sessionCount')
      .where('track.start BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const data = result.map((r) => ({
      date: r.date,
      totalHours: this.secondsToHours(parseFloat(r.totalSeconds || 0)),
      sessionCount: parseInt(r.sessionCount, 10),
    }));

    return { data, groupBy };
  }

  /**
   * Get hourly activity pattern
   */
  async getHourlyPattern(startDate?: string, endDate?: string) {
    const { startDate: start, endDate: end } = this.validateDateRange(
      startDate,
      endDate,
    );

    const result = await this.trackRepository
      .createQueryBuilder('track')
      .select('EXTRACT(HOUR FROM track.start)', 'hour')
      .addSelect('SUM(track.duration)', 'totalSeconds')
      .addSelect('COUNT(track.id)', 'sessionCount')
      .where('track.start BETWEEN :start AND :end', { start, end })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    const hourlyDistribution = result.map((r) => ({
      hour: parseInt(r.hour, 10),
      totalHours: this.secondsToHours(parseFloat(r.totalSeconds || 0)),
      sessionCount: parseInt(r.sessionCount, 10),
    }));

    return { hourlyDistribution };
  }

  /**
   * Get trends compared to previous period
   */
  async getTrends(
    metric: TrendMetric = TrendMetric.HOURS,
    period?: TimePeriod,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    let currentStart: Date, currentEnd: Date;

    if (startDateStr && endDateStr) {
      const range = this.validateDateRange(startDateStr, endDateStr);
      currentStart = range.startDate;
      currentEnd = range.endDate;
    } else {
      const range = this.getDateRange(period || TimePeriod.WEEK);
      currentStart = range.startDate;
      currentEnd = range.endDate;
    }

    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart.getTime());

    const currentTracks = await this.trackRepository.find({
      where: { start: Between(currentStart, currentEnd) },
    });

    const previousTracks = await this.trackRepository.find({
      where: { start: Between(previousStart, previousEnd) },
    });

    let current: number, previous: number;

    if (metric === TrendMetric.HOURS) {
      current = this.secondsToHours(
        currentTracks.reduce((sum, t) => sum + (t.duration || 0), 0),
      );
      previous = this.secondsToHours(
        previousTracks.reduce((sum, t) => sum + (t.duration || 0), 0),
      );
    } else {
      current = currentTracks.length;
      previous = previousTracks.length;
    }

    const change =
      previous > 0
        ? Math.round(((current - previous) / previous) * 100 * 100) / 100
        : 0;
    const trend =
      current > previous ? 'up' : current < previous ? 'down' : 'stable';

    return {
      current: Math.round(current * 100) / 100,
      previous: Math.round(previous * 100) / 100,
      change,
      trend,
      metric,
      period: period || 'custom',
    };
  }

  /**
   * Get top projects by time spent
   */
  async getTopProjects(
    limit: number = 5,
    period?: TimePeriod,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    let startDate: Date, endDate: Date;

    if (startDateStr && endDateStr) {
      const range = this.validateDateRange(startDateStr, endDateStr);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      const range = this.getDateRange(period || TimePeriod.MONTH);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const resultWithProject = await this.trackRepository
      .createQueryBuilder('track')
      .leftJoin('track.project', 'project')
      .select('project.id', 'projectId')
      .addSelect('project.name', 'projectName')
      .addSelect('track.projectId', 'trackProjectId')
      .addSelect('SUM(track.duration)', 'totalSeconds')
      .where('track.start BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('track.projectId IS NOT NULL')
      .andWhere('project.id IS NOT NULL')
      .andWhere('track.duration IS NOT NULL')
      .groupBy('project.id')
      .addGroupBy('project.name')
      .addGroupBy('track.projectId')
      .orderBy('SUM(track.duration)', 'DESC')
      .limit(limit)
      .getRawMany();

    // If no results with project relation, fallback to projectName field
    if (resultWithProject.length === 0) {
      const resultWithProjectName = await this.trackRepository
        .createQueryBuilder('track')
        .select('track.projectId', 'projectId')
        .addSelect('track.projectName', 'projectName')
        .addSelect('SUM(track.duration)', 'totalSeconds')
        .where('track.start BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .andWhere('track.projectName IS NOT NULL')
        .andWhere('track.duration IS NOT NULL')
        .groupBy('track.projectId')
        .addGroupBy('track.projectName')
        .orderBy('SUM(track.duration)', 'DESC')
        .limit(limit)
        .getRawMany();

      const topProjects = resultWithProjectName.map((r, index) => ({
        projectId: r.projectId,
        projectName: r.projectName,
        totalHours: this.secondsToHours(parseFloat(r.totalSeconds || 0)),
        rank: index + 1,
      }));

      return { topProjects, period: period || 'custom' };
    }

    const topProjects = resultWithProject.map((r, index) => ({
      projectId: r.projectId,
      projectName: r.projectName,
      totalHours: this.secondsToHours(parseFloat(r.totalSeconds || 0)),
      rank: index + 1,
    }));

    return { topProjects, period: period || 'custom' };
  }
}
