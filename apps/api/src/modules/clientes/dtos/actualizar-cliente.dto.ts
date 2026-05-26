import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ActualizarClienteDto {
  @ApiPropertyOptional({ example: true, description: 'Activa o desactiva el cliente en el workspace' })
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;
}
