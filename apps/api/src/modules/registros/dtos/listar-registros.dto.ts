import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class ListarRegistrosDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20, description: 'Registros por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Filtrar desde esta fecha (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-05-31', description: 'Filtrar hasta esta fecha (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
