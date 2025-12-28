import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import axios, { AxiosRequestConfig } from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from './entities/track.entity';
import { Project } from './entities/project.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TracksService {
  private readonly togglApiUrl = 'https://api.track.toggl.com/api/v9';

  constructor(
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private authService: AuthService,
  ) {}

  private async getAxiosConfigForUser(userId: number): Promise<AxiosRequestConfig> {
    const togglConfig = await this.authService.getDecryptedTogglToken(userId);

    if (!togglConfig) {
      throw new BadRequestException('Toggl API token not configured. Please add your token in Settings.');
    }

    return {
      auth: {
        username: togglConfig.token,
        password: 'api_token',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  async getWorkspaceIdForUser(userId: number): Promise<string> {
    const togglConfig = await this.authService.getDecryptedTogglToken(userId);
    if (!togglConfig) {
      throw new BadRequestException('Toggl API token not configured. Please add your token in Settings.');
    }
    return togglConfig.workspaceId;
  }

  async getCurrentRunningTask(userId: number) {
    try {
      const config = await this.getAxiosConfigForUser(userId);
      const res = await axios.get(
        `${this.togglApiUrl}/me/time_entries/current`,
        config,
      );

      return res.data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error fetching current running task:', error.message);
      throw new Error('Failed to fetch current running task');
    }
  }

  async getAllTasks(userId: number, startDate?: string, endDate?: string) {
    let url = `${this.togglApiUrl}/me/time_entries`;
    const config = await this.getAxiosConfigForUser(userId);
    try {
      const params = new URLSearchParams();

      const now = new Date();
      const end = endDate ? new Date(endDate) : now;
      let start: Date;

      // Toggl API v9 limitation: can only fetch data from last 3 months
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() + 1); // Add 1 day to be safe

      if (startDate) {
        start = new Date(startDate);
      } else {
        // Default to 3 months back (API limit)
        start = threeMonthsAgo;
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
      }

      if (start > end) {
        throw new Error(
          `Start date (${start.toISOString().split('T')[0]}) cannot be after end date (${end.toISOString().split('T')[0]})`,
        );
      }

      if (start < threeMonthsAgo) {
        console.warn(
          `Start date ${start.toISOString().split('T')[0]} is older than 3 months. Adjusting to ${threeMonthsAgo.toISOString().split('T')[0]}`,
        );
        start = threeMonthsAgo;
      }

      if (start > end) {
        throw new Error(
          `The requested date range is outside the 3-month API limit. Please request dates from ${threeMonthsAgo.toISOString().split('T')[0]} onwards.`,
        );
      }

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      if (startDateStr) params.append('start_date', startDateStr);
      if (endDateStr) params.append('end_date', endDateStr);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Requesting Toggl URL:', url);
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Toggl API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: url,
      });

      if (error.response?.status === 400) {
        const togglMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.message || 'Bad request';
        throw new Error(`Toggl API Error: ${togglMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your Toggl API token.',
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          'Access forbidden. Please check your Toggl workspace permissions.',
        );
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response) {
        throw new Error(
          `Toggl API returned error ${error.response.status}: ${error.response.data}`,
        );
      } else if (error.message) {
        throw error; // Re-throw validation errors
      } else {
        throw new Error(
          'Failed to connect to Toggl API. Please check your internet connection.',
        );
      }
    }
  }

  async create(createTrackDto: CreateTrackDto) {
    const track = this.trackRepository.create(createTrackDto);
    return await this.trackRepository.save(track);
  }

  async findAll(userId: number) {
    return await this.trackRepository.find({ where: { userId } });
  }

  async findOne(id: number, userId: number) {
    return await this.trackRepository.findOneBy({ id, userId });
  }

  async update(id: number, updateTrackDto: UpdateTrackDto) {
    return await this.trackRepository.update(id, updateTrackDto);
  }

  async remove(id: number) {
    return await this.trackRepository.delete(id);
  }

  async findByProject(projectName: string, userId: number) {
    return await this.trackRepository.find({
      where: { projectName, userId },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, userId: number, projectName?: string) {
    const query = this.trackRepository
      .createQueryBuilder('track')
      .where('track.start >= :startDate AND track.start <= :endDate', {
        startDate,
        endDate,
      })
      .andWhere('track.userId = :userId', { userId });

    if (projectName) {
      query.andWhere('track.projectName = :projectName', { projectName });
    }

    return await query.getMany();
  }

  async findPaginated(page: number, limit: number, userId: number) {
    return await this.trackRepository.find({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneWithProject(id: number, userId: number) {
    return await this.trackRepository.findOne({
      where: { id, userId },
      relations: ['project'],
    });
  }

  /**
   * Sync time entries from Toggl to PostgreSQL
   * @param startDate Optional start date (ISO format)
   * @param endDate Optional end date (ISO format)
   * @returns Sync statistics
   */
  async syncFromToggl(userId: number, startDate?: string, endDate?: string) {
    const config = await this.getAxiosConfigForUser(userId);
    const workspaceId = await this.getWorkspaceIdForUser(userId);
    try {
      let url = `${this.togglApiUrl}/me/time_entries`;
      const params = new URLSearchParams();

      const now = new Date();
      let end: Date;

      if (endDate) {
        end = new Date(endDate);
      } else {
        //note:  Add 1 day to include current day's entries
        end = new Date(now);
        end.setDate(end.getDate() + 1);
      }

      let start: Date;

      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() + 1);

      if (startDate) {
        start = new Date(startDate);
      } else {
        start = threeMonthsAgo;
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
      }

      if (start > end) {
        throw new Error(
          `Start date (${start.toISOString().split('T')[0]}) cannot be after end date (${end.toISOString().split('T')[0]})`,
        );
      }

      if (start < threeMonthsAgo) {
        console.warn(
          `Start date ${start.toISOString().split('T')[0]} is older than 3 months. Adjusting to ${threeMonthsAgo.toISOString().split('T')[0]}`,
        );
        start = threeMonthsAgo;
      }

      if (start > end) {
        throw new Error(
          `The requested date range is outside the 3-month API limit. Please request dates from ${threeMonthsAgo.toISOString().split('T')[0]} onwards.`,
        );
      }

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      if (startDateStr) params.append('start_date', startDateStr);
      if (endDateStr) params.append('end_date', endDateStr);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log(`Fetching Toggl entries from: ${url}`);

      const response = await axios.get(url, config);
      const togglEntries = response.data;

      console.log(`Received ${togglEntries?.length || 0} entries from Toggl`);

      if (!Array.isArray(togglEntries)) {
        console.error('Invalid Toggl API response:', togglEntries);
        throw new Error('Invalid response from Toggl API');
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const errors: Array<{ entryId: any; error: string }> = [];

      for (const entry of togglEntries) {
        try {
          if (!entry.id || !entry.start) {
            console.warn(`Skipping entry with missing required fields:`, entry);
            skipped++;
            continue;
          }

          const existingTrack = await this.trackRepository.findOne({
            where: { togglId: entry.id },
          });

          let projectId: number | undefined;
          let projectName: string | undefined;

          if (entry.project_id) {
            console.log(
              `Processing project ${entry.project_id} for entry ${entry.id}`,
            );

            let project = await this.projectRepository.findOne({
              where: { id: entry.project_id },
            });

            if (!project) {
              console.log(
                `Project ${entry.project_id} not found, fetching from Toggl...`,
              );

              try {
                const projectResponse = await axios.get(
                  `${this.togglApiUrl}/workspaces/${workspaceId}/projects/${entry.project_id}`,
                  config,
                );

                console.log(`Fetched project: ${projectResponse.data.name}`);

                project = this.projectRepository.create({
                  id: entry.project_id,
                  name:
                    projectResponse.data.name || `Project ${entry.project_id}`,
                  description: projectResponse.data.notes || null,
                  userId,
                });

                await this.projectRepository.save(project);
                console.log(`Saved project ${project.id}: ${project.name}`);
              } catch (projectError) {
                console.warn(
                  `Failed to fetch project ${entry.project_id}:`,
                  projectError.message,
                );
                console.warn(
                  `Response status: ${projectError.response?.status}, Data:`,
                  projectError.response?.data,
                );

                project = this.projectRepository.create({
                  id: entry.project_id,
                  name: `Project ${entry.project_id}`,
                  description: null,
                  userId,
                });
                await this.projectRepository.save(project);
                console.log(`Created fallback project ${project.id}`);
              }
            } else {
              console.log(
                `Using existing project ${project.id}: ${project.name}`,
              );
            }

            projectId = project.id;
            projectName = project.name;
            console.log(
              `Set projectId=${projectId}, projectName=${projectName}`,
            );
          } else {
            console.log(`Entry ${entry.id} has no project_id`);
          }

          const trackData = {
            togglId: entry.id,
            description: entry.description || '(No description)',
            start: new Date(entry.start),
            duration:
              entry.duration && entry.duration > 0 ? entry.duration : undefined,
            projectId,
            projectName,
            tags: entry.tags || [],
            userId,
          };

          if (existingTrack) {
            await this.trackRepository.update(existingTrack.id, trackData);
            updated++;
          } else {
            const newTrack = this.trackRepository.create(trackData);
            await this.trackRepository.save(newTrack);
            created++;
          }
        } catch (error) {
          console.error(
            `Error processing entry ${entry?.id}:`,
            error.message,
            error.stack,
          );
          errors.push({ entryId: entry?.id, error: error.message });
          skipped++;
        }
      }

      const result = {
        success: true,
        total: togglEntries.length,
        created,
        updated,
        skipped,
        dateRange: {
          startDate: startDateStr,
          endDate: endDateStr,
        },
        message: `Synced ${togglEntries.length} entries from ${startDateStr} to ${endDateStr}: ${created} created, ${updated} updated, ${skipped} skipped`,
      };

      if (errors.length > 0) {
        result['errors'] = errors.slice(0, 5);
      }

      console.log('Sync completed:', result);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error syncing from Toggl:', error.message, error.stack);
      if (error.response) {
        console.error(
          'Toggl API response error:',
          error.response.status,
          error.response.data,
        );
      }

      if (error.response?.status === 400) {
        const togglMessage =
          typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.message || 'Bad request';
        throw new Error(`Toggl API Error: ${togglMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed. Please check your Toggl API token.',
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          'Access forbidden. Please check your Toggl workspace permissions.',
        );
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response) {
        throw new Error(
          `Toggl API returned error ${error.response.status}: ${error.response.data}`,
        );
      } else if (error.message) {
        throw error; // Re-throw validation errors
      } else {
        throw new Error(
          'Failed to connect to Toggl API. Please check your internet connection.',
        );
      }
    }
  }
}
