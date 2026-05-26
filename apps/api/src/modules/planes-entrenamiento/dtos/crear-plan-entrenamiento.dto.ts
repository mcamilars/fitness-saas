import { TipoPlanEntrenamiento } from '@repo/database';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CrearPlanEntrenamientoDto {
  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TipoPlanEntrenamiento)
  tipo!: TipoPlanEntrenamiento;
}
