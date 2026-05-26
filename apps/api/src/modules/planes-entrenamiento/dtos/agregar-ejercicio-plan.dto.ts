import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class AgregarEjercicioPlanDto {
  @ApiProperty({ example: 'uuid-del-ejercicio' })
  @IsString()
  @MinLength(1)
  ejercicioId!: string;

  @ApiProperty({ example: 4, minimum: 1 })
  @IsInt()
  @Min(1)
  series!: number;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  repeticiones!: number;

  @ApiPropertyOptional({ example: 60, minimum: 0, description: 'Segundos de descanso entre series' })
  @IsInt()
  @Min(0)
  @IsOptional()
  segundosDeDescanso?: number;

  @ApiPropertyOptional({ example: 'Controlar el descenso en 3 segundos' })
  @IsString()
  @IsOptional()
  notas?: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Posición del ejercicio dentro del plan' })
  @IsInt()
  @Min(1)
  orden!: number;
}
