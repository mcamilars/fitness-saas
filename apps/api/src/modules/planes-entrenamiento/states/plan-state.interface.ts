import type { EstadoPlan, PlanDeEntrenamiento } from '@repo/database';
import type { PlanesEntrenamientoRepositoryInterface } from '../repositories/planes-entrenamiento.repository';

export interface PlanSubjectLike {
  notify?: (
    planId: string,
    evento: { tipo: string; planId: string },
  ) => void | Promise<void>;
}

export interface PlanStateContext {
  repository: PlanesEntrenamientoRepositoryInterface;
  subject?: PlanSubjectLike;
}

export interface PlanState {
  activar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState>;
  archivar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState>;
  getEstado(): EstadoPlan;
}
