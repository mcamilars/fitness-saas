import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class AgregarEjercicioPlanDto {
  @IsString()
  @MinLength(1)
  ejercicioId!: string;

  @IsInt()
  @Min(1)
  series!: number;

  @IsInt()
  @Min(1)
  repeticiones!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  segundosDeDescanso?: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsInt()
  @Min(1)
  orden!: number;
}
