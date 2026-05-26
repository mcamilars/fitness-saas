import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GrupoMuscular } from '@repo/database';

export class EjercicioRegistroDto {
  @ApiProperty({ example: 'Press de banca' })
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty({ enum: GrupoMuscular, example: GrupoMuscular.PECHO })
  @IsEnum(GrupoMuscular)
  grupoMuscular!: GrupoMuscular;

  @ApiProperty({ example: 4, minimum: 1 })
  @IsInt()
  @Min(1)
  series!: number;

  @ApiProperty({ example: 10, minimum: 1 })
  @IsInt()
  @Min(1)
  repeticiones!: number;

  @ApiPropertyOptional({ example: 80, minimum: 0, description: 'Peso utilizado en kilogramos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoKg?: number;

  @ApiPropertyOptional({ example: 'Último set al fallo' })
  @IsOptional()
  @IsString()
  notas?: string;
}

export class CrearRegistroEntrenamientoDto {
  @ApiProperty({ example: '2026-05-26', description: 'Fecha del entrenamiento (ISO 8601)' })
  @IsDateString()
  fecha!: string;

  @ApiPropertyOptional({ example: 60, minimum: 1, description: 'Duración total en minutos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duracionMin?: number;

  @ApiPropertyOptional({ example: 'Buena sesión, mucha energía' })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ type: [EjercicioRegistroDto], description: 'Lista de ejercicios realizados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EjercicioRegistroDto)
  ejercicios!: EjercicioRegistroDto[];
}
