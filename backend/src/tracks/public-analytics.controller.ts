import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AnalyticsService,
  TimePeriod,
  TrendMetric,
} from './analytics.service';
import { ConfigService } from '@nestjs/config';

@Controller('public-stats')
export class PublicAnalyticsController {
  private readonly logger = new Logger(PublicAnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates API key from query parameter
   */
  private validateApiKey(apiKey: string): void {
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      this.logger.warn('API_KEY not configured in environment variables');
      throw new UnauthorizedException('API key authentication not configured');
    }

    if (!apiKey || apiKey !== validApiKey) {
      this.logger.warn('Invalid API key attempt');
      throw new UnauthorizedException('Invalid API key');
    }
  }

  /**
   * GET /public-stats/summary?apiKey=xxx&userId=xxx&period=today|week|month|all
   * GET /public-stats/summary?apiKey=xxx&userId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get summary statistics for a given period or custom date range
   */
  @Get('summary')
  async getSummary(
    @Query('apiKey') apiKey: string,
    @Query('userId') userId: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.validateApiKey(apiKey);

    if (!userId) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'userId is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const validPeriod = this.validatePeriod(period);
      return await this.analyticsService.getSummaryStats(
        parseInt(userId, 10),
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
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /public-stats/top-projects?apiKey=xxx&userId=xxx&limit=5&period=week|month|all
   * GET /public-stats/top-projects?apiKey=xxx&userId=xxx&limit=5&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   * Get top projects by time spent
   */
  @Get('top-projects')
  async getTopProjects(
    @Query('apiKey') apiKey: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.validateApiKey(apiKey);

    if (!userId) {
      throw new HttpException(
        { statusCode: HttpStatus.BAD_REQUEST, message: 'userId is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const validLimit = limit ? parseInt(limit, 10) : 5;
      const validPeriod = this.validatePeriod(period);
      return await this.analyticsService.getTopProjects(
        parseInt(userId, 10),
        validLimit,
        validPeriod,
        startDate,
        endDate,
      );
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
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validatePeriod(period?: string): TimePeriod {
    if (!period) return TimePeriod.WEEK;

    const validPeriods = Object.values(TimePeriod);
    if (validPeriods.includes(period as TimePeriod)) {
      return period as TimePeriod;
    }
    return TimePeriod.WEEK;
  }
}
