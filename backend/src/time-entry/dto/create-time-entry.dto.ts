import {
  IsString,
  IsDateString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsUUID,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateTimeEntryDto {
  @IsUUID()
  auditId: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(0)
  @Max(23)
  hourSlot: number;

  @IsString()
  @Length(1, 255)
  activityDescription: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationMinutes?: number;

  @IsBoolean()
  isImportant: boolean;

  @IsBoolean()
  isUrgent: boolean;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
