import { IsString, IsBoolean, IsOptional, Length } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isImportant: boolean;

  @IsBoolean()
  isUrgent: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  category?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  icon?: string;
}
