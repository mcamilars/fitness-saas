import { Injectable } from '@nestjs/common';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type {
  AsignacionPeriodo,
  PeriodoResumen,
  ProgresoResumen,
  ProgresoStrategy,
  ProgresoStrategyContexto,
} from './progreso-strategy.interface';

const SIN_PLAN = 'Sin plan asignado';

function asignacionVigenteEn(
  asignaciones: AsignacionPeriodo[],
  fecha: Date,
): AsignacionPeriodo | undefined {
  const ordenadas = [...asignaciones].sort(
    (a, b) => a.asignadoEn.getTime() - b.asignadoEn.getTime(),
  );

  let vigente: AsignacionPeriodo | undefined;

  for (const asignacion of ordenadas) {
    if (asignacion.asignadoEn.getTime() <= fecha.getTime()) {
      vigente = asignacion;
    }
  }

  return vigente;
}

@Injectable()
export class ProgresoPorPlanStrategy implements ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen {
    const asignaciones = contexto?.asignaciones ?? [];
    const mapa = new Map<string, PeriodoResumen>();

    for (const registro of registros) {
      const fecha = new Date(registro.fecha);
      const asignacion = asignacionVigenteEn(asignaciones, fecha);
      const etiqueta = asignacion?.etiqueta ?? SIN_PLAN;

      const periodo = mapa.get(etiqueta) ?? {
        etiqueta,
        totalSesiones: 0,
        totalEjercicios: 0,
        duracionTotalMin: 0,
      };

      periodo.totalSesiones += 1;
      periodo.totalEjercicios += registro.ejercicios.length;
      periodo.duracionTotalMin += registro.duracionMin ?? 0;

      mapa.set(etiqueta, periodo);
    }

    const periodos = Array.from(mapa.values());

    return { totalSesiones: registros.length, periodos };
  }
}
