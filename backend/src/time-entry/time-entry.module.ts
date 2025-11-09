import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntryController } from './time-entry.controller';
import { TimeEntryService } from './time-entry.service';
import { TimeEntry } from './entities/time-entry.entity';
import { Audit } from '../audit/entities/audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry, Audit])],
  controllers: [TimeEntryController],
  providers: [TimeEntryService],
  exports: [TimeEntryService],
})
export class TimeEntryModule {}
