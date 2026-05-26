import { Injectable } from '@nestjs/common';
import { TipoPlanEntrenamiento } from '@repo/database';
import { FuerzaFactory } from './fuerza.factory';
import { HipertrofiaFactory } from './hipertrofia.factory';
import { PlanFactory } from './plan.factory';
import { ResistenciaFactory } from './resistencia.factory';

@Injectable()
export class PlanFactoriesProvider {
  private readonly factories: Record<TipoPlanEntrenamiento, PlanFactory> = {
    [TipoPlanEntrenamiento.HIPERTROFIA]: new HipertrofiaFactory(),
    [TipoPlanEntrenamiento.FUERZA]: new FuerzaFactory(),
    [TipoPlanEntrenamiento.RESISTENCIA]: new ResistenciaFactory(),
  };

  obtener(tipo: TipoPlanEntrenamiento): PlanFactory {
    return this.factories[tipo];
  }
}
