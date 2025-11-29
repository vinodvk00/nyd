import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
