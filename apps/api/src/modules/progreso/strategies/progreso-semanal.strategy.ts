import { Injectable } from '@nestjs/common';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type {
  PeriodoResumen,
  ProgresoResumen,
  ProgresoStrategy,
  ProgresoStrategyContexto,
} from './progreso-strategy.interface';

function formatearFechaCorta(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

function semanaLabel(date: Date): string {
  const fechaUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = fechaUtc.getUTCDay() || 7;

  const inicioSemana = new Date(fechaUtc);
  inicioSemana.setUTCDate(fechaUtc.getUTCDate() - dayNum + 1);

  const finSemana = new Date(inicioSemana);
  finSemana.setUTCDate(inicioSemana.getUTCDate() + 6);

  return `${formatearFechaCorta(inicioSemana)} - ${formatearFechaCorta(finSemana)}`;
}

@Injectable()
export class ProgresoSemanalStrategy implements ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    _contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen {
    const mapa = new Map<string, PeriodoResumen>();

    for (const registro of registros) {
      const etiqueta = semanaLabel(new Date(registro.fecha));

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
