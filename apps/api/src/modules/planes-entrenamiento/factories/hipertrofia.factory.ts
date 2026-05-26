import { TipoPlanEntrenamiento } from '@repo/database';
import { type CrearPlanFactoryDto, type PlanDraft, PlanFactory } from './plan.factory';

export class HipertrofiaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      ejercicioDefaults: {
        series: 4,
        repeticiones: 10,
        segundosDeDescanso: 60,
      },
    };
  }
}
