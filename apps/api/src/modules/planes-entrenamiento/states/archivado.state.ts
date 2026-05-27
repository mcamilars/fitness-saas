import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, type PlanDeEntrenamiento } from '@repo/database';
import { ActivoState } from './activo.state';
import type { PlanState, PlanStateContext } from './plan-state.interface';

export class ArchivadoState implements PlanState {
  getEstado(): EstadoPlan {
    return EstadoPlan.ARCHIVADO;
  }

  async activar(
    plan: PlanDeEntrenamiento,
    ctx: PlanStateContext,
  ): Promise<PlanState> {
    await ctx.repository.updateEstado(plan.id, EstadoPlan.ACTIVO);
    await ctx.subject?.notify?.(plan.id, {
      tipo: 'PLAN_ACTIVADO',
      planId: plan.id,
    });

    return new ActivoState();
  }

  archivar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('El plan ya está archivado'));
  }
}
