import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, type PlanDeEntrenamiento } from '@repo/database';
import { ActivoState } from './activo.state';
import type { PlanState, PlanStateContext } from './plan-state.interface';

export class BorradorState implements PlanState {
  getEstado(): EstadoPlan {
    return EstadoPlan.BORRADOR;
  }

  async activar(
    plan: PlanDeEntrenamiento,
    ctx: PlanStateContext,
  ): Promise<PlanState> {
    const cantidadEjercicios = await ctx.repository.contarEjercicios(plan.id);

    if (cantidadEjercicios < 1) {
      throw new BadRequestException('No se puede activar un plan sin ejercicios');
    }

    await ctx.repository.updateEstado(plan.id, EstadoPlan.ACTIVO);
    await ctx.subject?.notify?.(plan.id, {
      tipo: 'PLAN_ACTIVADO',
      planId: plan.id,
    });

    return new ActivoState();
  }

  archivar(): Promise<PlanState> {
    return Promise.reject(
      new BadRequestException('No se puede archivar un plan en borrador'),
    );
  }
}
