import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get('toggl/current')
  async getTogglCurrentRunningTask() {
    return await this.tracksService.getCurrentRunningTask();
  }

  @Get('toggl')
  async getAllTasks(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.tracksService.getAllTasks(startDate, endDate);
  }

  @Post('sync')
  async syncFromToggl(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.tracksService.syncFromToggl(startDate, endDate);
  }

  @Post()
  create(@Body() createTrackDto: CreateTrackDto) {
    return this.tracksService.create(createTrackDto);
  }

  @Get()
  findAll() {
    return this.tracksService.findAll();
  }

  @Get('project/:projectName')
  findByProject(@Param('projectName') projectName: string) {
    return this.tracksService.findByProject(projectName);
  }

  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('projectName') projectName?: string,
  ) {
    return this.tracksService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      projectName,
    );
  }

  @Get('paginated')
  findPaginated(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.tracksService.findPaginated(page, limit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tracksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrackDto: UpdateTrackDto,
  ) {
    return this.tracksService.update(id, updateTrackDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tracksService.remove(id);
  }
}
