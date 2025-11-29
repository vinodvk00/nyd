import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { GoalPriority, TargetPeriod } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsEnum(GoalPriority)
  @IsOptional()
  priority?: GoalPriority;

  @IsNumber()
  @Min(0)
  targetHours: number;

  @IsEnum(TargetPeriod)
  @IsOptional()
  targetPeriod?: TargetPeriod;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumDaily?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNumber()
  categoryId: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
