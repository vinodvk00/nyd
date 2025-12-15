import { IsString, IsInt, IsOptional, Length, Min, Max } from 'class-validator';

export class CreateAuditDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @IsOptional()
  @IsString()
  goal?: string;
}
