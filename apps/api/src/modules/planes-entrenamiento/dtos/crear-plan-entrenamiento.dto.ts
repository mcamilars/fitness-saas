import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPlanEntrenamiento } from '@repo/database';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CrearPlanEntrenamientoDto {
  @ApiProperty({ example: 'Hipertrofia 3x semana', minLength: 3 })
  @IsString()
  @MinLength(3)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Plan enfocado en volumen muscular de empuje y jale' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: TipoPlanEntrenamiento, example: TipoPlanEntrenamiento.HIPERTROFIA })
  @IsEnum(TipoPlanEntrenamiento)
  tipo!: TipoPlanEntrenamiento;
}
