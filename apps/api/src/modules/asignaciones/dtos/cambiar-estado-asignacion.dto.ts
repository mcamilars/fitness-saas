import { EstadoAsignacion } from '@repo/database';
import { IsEnum } from 'class-validator';

export class CambiarEstadoAsignacionDto {
  @IsEnum(EstadoAsignacion)
  estado!: EstadoAsignacion;
}
