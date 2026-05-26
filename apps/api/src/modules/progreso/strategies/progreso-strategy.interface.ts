import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';

export interface PeriodoResumen {
  etiqueta: string;
  totalSesiones: number;
  totalEjercicios: number;
  duracionTotalMin: number;
}

export interface ProgresoResumen {
  totalSesiones: number;
  periodos: PeriodoResumen[];
}

export interface AsignacionPeriodo {
  planDeEntrenamientoId: string;
  etiqueta: string;
  asignadoEn: Date;
}

export interface ProgresoStrategyContexto {
  asignaciones?: AsignacionPeriodo[];
}

export interface ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen;
}
