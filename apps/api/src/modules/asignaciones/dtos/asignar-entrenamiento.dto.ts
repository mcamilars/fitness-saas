import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AsignarEntrenamientoDto {
  @ApiProperty({ example: 'uuid-del-cliente', description: 'ID del cliente al que se asigna el plan' })
  @IsString()
  @MinLength(1)
  clienteId!: string;

  @ApiProperty({ example: 'uuid-del-plan', description: 'ID del plan de entrenamiento a asignar' })
  @IsString()
  @MinLength(1)
  planEntrenamientoId!: string;
}
