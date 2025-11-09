import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityTemplateController } from './activity-template.controller';
import { ActivityTemplateService } from './activity-template.service';
import { ActivityTemplate } from './entities/activity-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityTemplate])],
  controllers: [ActivityTemplateController],
  providers: [ActivityTemplateService],
  exports: [ActivityTemplateService],
})
export class ActivityTemplateModule {}
