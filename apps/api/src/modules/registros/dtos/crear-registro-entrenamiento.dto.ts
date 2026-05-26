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
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsEnum(GrupoMuscular)
  grupoMuscular!: GrupoMuscular;

  @IsInt()
  @Min(1)
  series!: number;

  @IsInt()
  @Min(1)
  repeticiones!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pesoKg?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class CrearRegistroEntrenamientoDto {
  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracionMin?: number;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EjercicioRegistroDto)
  ejercicios!: EjercicioRegistroDto[];
}
