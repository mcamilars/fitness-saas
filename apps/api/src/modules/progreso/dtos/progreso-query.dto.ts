import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import type { VistaProgreso } from '../services/progreso.service';

export class ProgresoQueryDto {
  @ApiPropertyOptional({
    enum: ['semanal', 'mensual', 'porPlan'],
    default: 'semanal',
    description: 'Granularidad del análisis de progreso',
  })
  @IsOptional()
  @IsIn(['semanal', 'mensual', 'porPlan'])
  vista?: VistaProgreso;
}
