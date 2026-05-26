import { IsBoolean, IsOptional } from 'class-validator';

export class ActualizarClienteDto {
  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;
}
