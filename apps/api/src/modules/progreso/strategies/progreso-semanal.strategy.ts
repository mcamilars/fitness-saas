import { Injectable } from '@nestjs/common';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type {
  PeriodoResumen,
  ProgresoResumen,
  ProgresoStrategy,
  ProgresoStrategyContexto,
} from './progreso-strategy.interface';

function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

@Injectable()
export class ProgresoSemanalStrategy implements ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    _contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen {
    const mapa = new Map<string, PeriodoResumen>();

    for (const registro of registros) {
      const etiqueta = isoWeekLabel(new Date(registro.fecha));

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

    const periodos = Array.from(mapa.values()).sort((a, b) =>
      a.etiqueta.localeCompare(b.etiqueta),
    );

    return { totalSesiones: registros.length, periodos };
  }
}
