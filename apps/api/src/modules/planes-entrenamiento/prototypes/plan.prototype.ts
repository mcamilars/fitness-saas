import { EstadoPlan, type EjercicioPlan, type PlanDeEntrenamiento } from '@repo/database';
import type { PlanCloneSnapshot } from '../repositories/planes-entrenamiento.repository';

export interface Cloneable<T> {
  clone(): T;
}

type EjercicioPlanClonable = Pick<
  EjercicioPlan,
  'ejercicioId' | 'series' | 'repeticiones' | 'segundosDeDescanso' | 'notas' | 'orden'
>;

type PlanClonable = PlanDeEntrenamiento & {
  ejercicioPlanes?: EjercicioPlanClonable[];
};

export class PlanDeEntrenamientoPrototype
  implements Cloneable<PlanCloneSnapshot>
{
  constructor(private readonly original: PlanClonable) {}

  clone(): PlanCloneSnapshot {
    return {
      entrenadorId: this.original.entrenadorId,
      nombre: `${this.original.nombre} (copia)`,
      descripcion: this.original.descripcion,
      tipo: this.original.tipo,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: this.original.ejercicioPlanes?.map((ejercicioPlan) => ({
        ejercicioId: ejercicioPlan.ejercicioId,
        series: ejercicioPlan.series,
        repeticiones: ejercicioPlan.repeticiones,
        segundosDeDescanso: ejercicioPlan.segundosDeDescanso,
        notas: ejercicioPlan.notas,
        orden: ejercicioPlan.orden,
      })),
    };
  }
}
