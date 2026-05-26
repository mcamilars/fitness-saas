import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { GrupoMuscular } from '@repo/database';

export class CrearEjercicioDto {
  @ApiProperty({ example: 'Press de banca' })
  @IsString()
  @MinLength(1)
  nombre!: string;

  @ApiProperty({ enum: GrupoMuscular, example: GrupoMuscular.PECHO, description: 'Grupo muscular principal' })
  @IsEnum(GrupoMuscular)
  grupoMuscular!: GrupoMuscular;

  @ApiPropertyOptional({ example: 'Ejercicio compuesto para el pecho' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Acostarse en el banco, bajar la barra hasta el pecho...' })
  @IsString()
  @IsOptional()
  instrucciones?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/press-banca.jpg' })
  @IsString()
  @IsOptional()
  imagenUrl?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=abc123' })
  @IsString()
  @IsOptional()
  videoUrl?: string;
}
