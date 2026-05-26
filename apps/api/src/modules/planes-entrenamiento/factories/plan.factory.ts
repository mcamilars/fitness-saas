import { type TipoPlanEntrenamiento } from '@repo/database';

export interface CrearPlanFactoryDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanEntrenamiento;
}

export interface EjercicioPlanDraftDefaults {
  series: number;
  repeticiones: number;
  segundosDeDescanso: number;
}

export interface PlanDraft {
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanEntrenamiento;
  ejercicioDefaults: EjercicioPlanDraftDefaults;
}

export abstract class PlanFactory {
  abstract crear(dto: CrearPlanFactoryDto): PlanDraft;
}
