import { Injectable } from '@nestjs/common';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type {
  PeriodoResumen,
  ProgresoResumen,
  ProgresoStrategy,
  ProgresoStrategyContexto,
} from './progreso-strategy.interface';

function mesLabel(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

@Injectable()
export class ProgresoMensualStrategy implements ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    _contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen {
    const mapa = new Map<string, PeriodoResumen>();

    for (const registro of registros) {
      const etiqueta = mesLabel(new Date(registro.fecha));

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
