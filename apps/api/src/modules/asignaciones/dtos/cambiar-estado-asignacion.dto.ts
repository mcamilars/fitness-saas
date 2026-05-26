import { ApiProperty } from '@nestjs/swagger';
import { EstadoAsignacion } from '@repo/database';
import { IsEnum } from 'class-validator';

export class CambiarEstadoAsignacionDto {
  @ApiProperty({ enum: EstadoAsignacion, example: EstadoAsignacion.INACTIVO, description: 'Nuevo estado de la asignación' })
  @IsEnum(EstadoAsignacion)
  estado!: EstadoAsignacion;
}
