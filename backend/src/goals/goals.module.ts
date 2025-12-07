import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from './entities/area.entity';
import { Category } from './entities/category.entity';
import { Goal } from './entities/goal.entity';
import { Track } from '../tracks/entities/track.entity';
import { AreaService } from './services/area.service';
import { CategoryService } from './services/category.service';
import { GoalService } from './services/goal.service';
import { GoalSeedService } from './services/goal-seed.service';
import { AreaController } from './controllers/area.controller';
import { CategoryController } from './controllers/category.controller';
import { GoalController } from './controllers/goal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Area, Category, Goal, Track])],
  controllers: [AreaController, CategoryController, GoalController],
  providers: [
    AreaService,
    CategoryService,
    GoalService,
    GoalSeedService,
  ],
  exports: [AreaService, CategoryService, GoalService],
})
export class GoalsModule {}
