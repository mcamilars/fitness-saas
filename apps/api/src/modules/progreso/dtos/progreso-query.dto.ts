import { IsIn, IsOptional } from 'class-validator';
import type { VistaProgreso } from '../services/progreso.service';

export class ProgresoQueryDto {
  @IsOptional()
  @IsIn(['semanal', 'mensual', 'porPlan'])
  vista?: VistaProgreso;
}
