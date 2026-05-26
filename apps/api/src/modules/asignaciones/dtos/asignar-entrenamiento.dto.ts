import { IsString, MinLength } from 'class-validator';

export class AsignarEntrenamientoDto {
  @IsString()
  @MinLength(1)
  clienteId!: string;

  @IsString()
  @MinLength(1)
  planEntrenamientoId!: string;
}
