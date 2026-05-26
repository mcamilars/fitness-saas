import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GrupoMuscular } from '@repo/database';

export class CrearEjercicioDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsEnum(GrupoMuscular)
  grupoMuscular!: GrupoMuscular;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  instrucciones?: string;

  @IsString()
  @IsOptional()
  imagenUrl?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;
}
