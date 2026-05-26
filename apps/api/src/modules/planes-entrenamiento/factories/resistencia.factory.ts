import { TipoPlanEntrenamiento } from '@repo/database';
import { type CrearPlanFactoryDto, type PlanDraft, PlanFactory } from './plan.factory';

export class ResistenciaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: TipoPlanEntrenamiento.RESISTENCIA,
      ejercicioDefaults: {
        series: 3,
        repeticiones: 15,
        segundosDeDescanso: 30,
      },
    };
  }
}
