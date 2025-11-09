import { IsString, IsDateString, IsIn, IsOptional, Length } from 'class-validator';

export class CreateAuditDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsDateString()
  startDate: string;

  @IsIn([7, 10])
  durationDays: number;

  @IsOptional()
  @IsString()
  goal?: string;
}
