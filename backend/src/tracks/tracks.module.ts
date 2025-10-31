import { Module } from '@nestjs/common';
import { TracksService } from './tracks.service';
import { TracksController } from './tracks.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Track } from './entities/track.entity';
import { Project } from './entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Track, Project])],
  controllers: [TracksController, AnalyticsController],
  providers: [TracksService, AnalyticsService],
})
export class TracksModule {}
