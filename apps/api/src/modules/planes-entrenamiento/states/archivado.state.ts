import { BadRequestException } from '@nestjs/common';
import { EstadoPlan } from '@repo/database';
import type { PlanState } from './plan-state.interface';

export class ArchivadoState implements PlanState {
  getEstado(): EstadoPlan {
    return EstadoPlan.ARCHIVADO;
  }

  activar(): Promise<PlanState> {
    return Promise.reject(
      new BadRequestException('No se puede activar un plan archivado'),
    );
  }

  archivar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('El plan ya está archivado'));
  }
}
