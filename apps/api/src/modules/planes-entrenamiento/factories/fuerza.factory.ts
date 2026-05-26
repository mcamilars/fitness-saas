import { TipoPlanEntrenamiento } from '@repo/database';
import { type CrearPlanFactoryDto, type PlanDraft, PlanFactory } from './plan.factory';

export class FuerzaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: TipoPlanEntrenamiento.FUERZA,
      ejercicioDefaults: {
        series: 5,
        repeticiones: 5,
        segundosDeDescanso: 180,
      },
    };
  }
}
