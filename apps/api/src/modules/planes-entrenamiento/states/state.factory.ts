import { Injectable } from '@nestjs/common';
import { EstadoPlan } from '@repo/database';
import { ActivoState } from './activo.state';
import { ArchivadoState } from './archivado.state';
import { BorradorState } from './borrador.state';
import { PlanState } from './plan-state.interface';

@Injectable()
export class PlanStateFactory {
  fromEstado(estado: EstadoPlan): PlanState {
    const states: Record<EstadoPlan, PlanState> = {
      [EstadoPlan.BORRADOR]: new BorradorState(),
      [EstadoPlan.ACTIVO]: new ActivoState(),
      [EstadoPlan.ARCHIVADO]: new ArchivadoState(),
    };

    return states[estado];
  }
}
