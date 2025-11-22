import { IsUUID, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTimeEntryDto } from './create-time-entry.dto';

class TimeEntryItemDto {
  hourSlot: number;
  activityDescription: string;
  durationMinutes?: number;
  isImportant: boolean;
  isUrgent: boolean;
  templateId?: string;
  notes?: string;
  startMinute: number;
}

export class BatchCreateEntriesDto {
  @IsUUID()
  auditId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeEntryItemDto)
  entries: TimeEntryItemDto[];
}
