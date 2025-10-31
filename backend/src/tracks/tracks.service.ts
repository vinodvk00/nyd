import { Injectable } from '@nestjs/common';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import axios, { AxiosRequestConfig } from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from './entities/track.entity';
import { Project } from './entities/project.entity';

@Injectable()
export class TracksService {
  private readonly togglApiUrl = 'https://api.track.toggl.com/api/v9';
  // private readonly apiToken = process.env.TOGGL_API_TOKEN;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  private getAxiosConfig(): AxiosRequestConfig {
    const apiToken = this.configService.get<string>('TOGGL_API_TOKEN');

    if (!apiToken) {
      throw new Error('TOGGL_API_TOKEN environment variable is not set');
    }
    return {
      auth: {
        username: apiToken as string,
        password: 'api_token',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  async getCurrentRunningTask() {
    try {
      const res = await axios.get(
        `${this.togglApiUrl}/me/time_entries/current`,
        this.getAxiosConfig(),
      );

      return res.data;
    } catch (error) {
      console.error('Error fetching current running task:', error.message);
      throw new Error('Failed to fetch current running task');
    }
  }

  async getAllTasks(startDate?: string, endDate?: string) {
    try {
      let url = `${this.togglApiUrl}/me/time_entries`;
      const params = new URLSearchParams();

      // Toggl API v9 limitation: can only fetch data from last 3 months
      const end = endDate ? new Date(endDate) : new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() + 1); // Add 1 day to be safe

      let start: Date;
      if (startDate) {
        start = new Date(startDate);
        // Validate that start date is not older than 3 months
        if (start < threeMonthsAgo) {
          start = threeMonthsAgo;
        }
      } else {
        // Default to 3 months back (API limit)
        start = threeMonthsAgo;
      }

      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, this.getAxiosConfig());
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch all tasks: ${error.message}`);
    }
  }

  async create(createTrackDto: CreateTrackDto) {
    const track = this.trackRepository.create(createTrackDto);
    return await this.trackRepository.save(track);
  }

  async findAll() {
    return await this.trackRepository.find();
  }

  async findOne(id: number) {
    return await this.trackRepository.findOneBy({ id });
  }

  async update(id: number, updateTrackDto: UpdateTrackDto) {
    return await this.trackRepository.update(id, updateTrackDto);
  }

  async remove(id: number) {
    return await this.trackRepository.delete(id);
  }

  async findByProject(projectName: string) {
    return await this.trackRepository.find({
      where: { projectName },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return await this.trackRepository
      .createQueryBuilder('track')
      .where('track.start >= :startDate AND track.start <= :endDate', {
        startDate,
        endDate,
      })
      .getMany();
  }

  async findPaginated(page: number, limit: number) {
    return await this.trackRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneWithProject(id: number) {
    return await this.trackRepository.findOne({
      where: {id},
      relations: ['project']
    })
  }

  /**
   * Sync time entries from Toggl to PostgreSQL
   * @param startDate Optional start date (ISO format)
   * @param endDate Optional end date (ISO format)
   * @returns Sync statistics
   */
  async syncFromToggl(startDate?: string, endDate?: string) {
    try {
      let url = `${this.togglApiUrl}/me/time_entries`;
      const params = new URLSearchParams();

      const end = endDate ? new Date(endDate) : new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      threeMonthsAgo.setDate(threeMonthsAgo.getDate() + 1); // Add 1 day to be safe

      let start: Date;
      if (startDate) {
        start = new Date(startDate);
        if (start < threeMonthsAgo) {
          console.warn(
            `Requested start date ${startDate} is older than 3 months. Adjusting to ${threeMonthsAgo.toISOString().split('T')[0]}`,
          );
          start = threeMonthsAgo;
        }
      } else {
        start = threeMonthsAgo;
      }

      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log(`Fetching Toggl entries from: ${url}`);

      const response = await axios.get(url, this.getAxiosConfig());
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
            console.log(`Processing project ${entry.project_id} for entry ${entry.id}`);

            let project = await this.projectRepository.findOne({
              where: { id: entry.project_id },
            });

            if (!project) {
              console.log(`Project ${entry.project_id} not found, fetching from Toggl...`);

              try {
                const projectResponse = await axios.get(
                  `${this.togglApiUrl}/workspaces/${entry.workspace_id}/projects/${entry.project_id}`,
                  this.getAxiosConfig(),
                );

                console.log(`Fetched project: ${projectResponse.data.name}`);

                project = this.projectRepository.create({
                  id: entry.project_id,
                  name: projectResponse.data.name || `Project ${entry.project_id}`,
                  description: projectResponse.data.notes || null,
                });

                await this.projectRepository.save(project);
                console.log(`Saved project ${project.id}: ${project.name}`);
              } catch (projectError) {
                console.warn(`Failed to fetch project ${entry.project_id}:`, projectError.message);
                console.warn(`Response status: ${projectError.response?.status}, Data:`, projectError.response?.data);

                project = this.projectRepository.create({
                  id: entry.project_id,
                  name: `Project ${entry.project_id}`,
                  description: null,
                });
                await this.projectRepository.save(project);
                console.log(`Created fallback project ${project.id}`);
              }
            } else {
              console.log(`Using existing project ${project.id}: ${project.name}`);
            }

            projectId = project.id;
            projectName = project.name;
            console.log(`Set projectId=${projectId}, projectName=${projectName}`);
          } else {
            console.log(`Entry ${entry.id} has no project_id`);
          }

          const trackData = {
            togglId: entry.id,
            description: entry.description || '(No description)',
            start: new Date(entry.start),
            duration: entry.duration && entry.duration > 0 ? entry.duration : undefined,
            projectId,
            projectName,
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
          console.error(`Error processing entry ${entry?.id}:`, error.message, error.stack);
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
          startDate,
          endDate,
        },
        message: `Synced ${togglEntries.length} entries from ${startDate} to ${endDate}: ${created} created, ${updated} updated, ${skipped} skipped`,
      };

      if (errors.length > 0) {
        result['errors'] = errors.slice(0, 5); 
      }

      console.log('Sync completed:', result);
      return result;
    } catch (error) {
      console.error('Error syncing from Toggl:', error.message, error.stack);
      if (error.response) {
        console.error('Toggl API response error:', error.response.status, error.response.data);
      }
      throw new Error(`Failed to sync from Toggl: ${error.message}`);
    }
  }
}
