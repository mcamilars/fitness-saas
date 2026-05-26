import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, type PlanDeEntrenamiento } from '@repo/database';
import { ArchivadoState } from './archivado.state';
import type { PlanState, PlanStateContext } from './plan-state.interface';

export class ActivoState implements PlanState {
  getEstado(): EstadoPlan {
    return EstadoPlan.ACTIVO;
  }

  activar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('El plan ya está activo'));
  }

  async archivar(
    plan: PlanDeEntrenamiento,
    ctx: PlanStateContext,
  ): Promise<PlanState> {
    await ctx.repository.updateEstado(plan.id, EstadoPlan.ARCHIVADO);
    await ctx.subject?.notify?.(plan.id, {
      tipo: 'PLAN_ARCHIVADO',
      planId: plan.id,
    });

    return new ArchivadoState();
  }
}
