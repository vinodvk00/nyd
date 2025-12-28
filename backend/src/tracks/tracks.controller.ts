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
  UseGuards,
  Request,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get('toggl/current')
  async getTogglCurrentRunningTask(@Request() req) {
    return await this.tracksService.getCurrentRunningTask(req.user.userId);
  }

  @Get('toggl')
  async getAllTasks(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.tracksService.getAllTasks(req.user.userId, startDate, endDate);
  }

  @Post('sync')
  async syncFromToggl(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.tracksService.syncFromToggl(req.user.userId, startDate, endDate);
  }

  @Post()
  create(@Body() createTrackDto: CreateTrackDto) {
    return this.tracksService.create(createTrackDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.tracksService.findAll(req.user.userId);
  }

  @Get('project/:projectName')
  findByProject(@Request() req, @Param('projectName') projectName: string) {
    return this.tracksService.findByProject(projectName, req.user.userId);
  }

  @Get('date-range')
  findByDateRange(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('projectName') projectName?: string,
  ) {
    return this.tracksService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
      req.user.userId,
      projectName,
    );
  }

  @Get('paginated')
  findPaginated(@Request() req, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.tracksService.findPaginated(page, limit, req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.tracksService.findOne(id, req.user.userId);
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
