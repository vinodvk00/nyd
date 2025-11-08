import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  AnalyticsService,
  TimePeriod,
  GroupBy,
  TrendMetric,
} from './analytics.service';

@Controller('tracks/stats')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /tracks/stats/summary?period=today|week|month|all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get summary statistics for a given period or custom date range
   */
  @Get('summary')
  async getSummary(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const validPeriod = period ? this.validatePeriod(period) : undefined;
      return await this.analyticsService.getSummaryStats(
        validPeriod,
        startDate,
        endDate,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch summary statistics',
          error: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /tracks/stats/by-project?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get time breakdown by project
   */
  @Get('by-project')
  async getByProject(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      return await this.analyticsService.getProjectBreakdown(
        startDate,
        endDate,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch project breakdown',
          error: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /tracks/stats/by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=day|week|month
   * Get activity grouped by date
   */
  @Get('by-date')
  async getByDate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    try {
      const validGroupBy = this.validateGroupBy(groupBy);
      return await this.analyticsService.getActivityByDate(
        startDate,
        endDate,
        validGroupBy,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch activity by date',
          error: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /tracks/stats/hourly-pattern?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get hourly activity pattern
   */
  @Get('hourly-pattern')
  async getHourlyPattern(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      return await this.analyticsService.getHourlyPattern(startDate, endDate);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch hourly pattern',
          error: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /tracks/stats/trends?metric=hours|sessions&period=week|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get trends compared to previous period or custom date range
   */
  @Get('trends')
  async getTrends(
    @Query('metric') metric?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const validMetric = this.validateMetric(metric);
      const validPeriod = period ? this.validatePeriod(period) : undefined;
      return await this.analyticsService.getTrends(
        validMetric,
        validPeriod,
        startDate,
        endDate,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch trends',
          error: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /tracks/stats/top-projects?limit=5&period=week|month|all&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get top projects by time spent for a period or custom date range
   */
  @Get('top-projects')
  async getTopProjects(
    @Query('limit') limit?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      this.logger.log(
        `Fetching top projects - limit: ${limit || '5'}, period: ${period || 'month'}, startDate: ${startDate}, endDate: ${endDate}`,
      );
      const validLimit = limit ? parseInt(limit, 10) : 5;
      const validPeriod = period ? this.validatePeriod(period) : undefined;
      const result = await this.analyticsService.getTopProjects(
        validLimit,
        validPeriod,
        startDate,
        endDate,
      );
      this.logger.log(
        `Successfully fetched ${result.topProjects.length} top projects`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to fetch top projects: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch top projects',
          error: error.message,
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Validation helpers
  private validatePeriod(period?: string): TimePeriod {
    if (!period) return TimePeriod.MONTH;

    const validPeriods = Object.values(TimePeriod);
    if (validPeriods.includes(period as TimePeriod)) {
      return period as TimePeriod;
    }
    return TimePeriod.MONTH;
  }

  private validateGroupBy(groupBy?: string): GroupBy {
    if (!groupBy) return GroupBy.DAY;

    const validGroupBy = Object.values(GroupBy);
    if (validGroupBy.includes(groupBy as GroupBy)) {
      return groupBy as GroupBy;
    }
    return GroupBy.DAY;
  }

  private validateMetric(metric?: string): TrendMetric {
    if (!metric) return TrendMetric.HOURS;

    const validMetrics = Object.values(TrendMetric);
    if (validMetrics.includes(metric as TrendMetric)) {
      return metric as TrendMetric;
    }
    return TrendMetric.HOURS;
  }
}
