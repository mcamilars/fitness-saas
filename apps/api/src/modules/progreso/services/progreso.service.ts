import { Injectable } from '@nestjs/common';
import { AsignacionesEntrenamientoRepository } from '../../asignaciones/repositories/asignaciones-entrenamiento.repository';
import { RegistrosEntrenamientoRepository } from '../../registros/repositories/registros-entrenamiento.repository';
import { ProgresoMensualStrategy } from '../strategies/progreso-mensual.strategy';
import { ProgresoPorPlanStrategy } from '../strategies/progreso-por-plan.strategy';
import type { ProgresoResumen, ProgresoStrategy } from '../strategies/progreso-strategy.interface';
import { ProgresoSemanalStrategy } from '../strategies/progreso-semanal.strategy';

export type VistaProgreso = 'semanal' | 'mensual' | 'porPlan';

@Injectable()
export class ProgresoService {
  private estrategia: ProgresoStrategy;

  constructor(
    private readonly registrosRepository: RegistrosEntrenamientoRepository,
    private readonly asignacionesRepository: AsignacionesEntrenamientoRepository,
    private readonly semanalStrategy: ProgresoSemanalStrategy,
    private readonly mensualStrategy: ProgresoMensualStrategy,
    private readonly porPlanStrategy: ProgresoPorPlanStrategy,
  ) {
    this.estrategia = semanalStrategy;
  }

  setEstrategia(estrategia: ProgresoStrategy): void {
    this.estrategia = estrategia;
  }

  async calcularProgreso(
    clienteId: string,
    vista: VistaProgreso,
  ): Promise<ProgresoResumen> {
    const registros = await this.registrosRepository.findPorClienteConDetalle(clienteId);

    if (vista === 'mensual') {
      this.setEstrategia(this.mensualStrategy);
      return this.estrategia.calcular(registros);
    }

    if (vista === 'porPlan') {
      this.setEstrategia(this.porPlanStrategy);
      const asignaciones = await this.asignacionesRepository.findPorCliente(clienteId);
      const contexto = {
        asignaciones: asignaciones.map((a) => ({
          planDeEntrenamientoId: a.planDeEntrenamientoId,
          etiqueta: a.planDeEntrenamiento.nombre,
          asignadoEn: new Date(a.asignadoEn),
        })),
      };
      return this.estrategia.calcular(registros, contexto);
    }

    this.setEstrategia(this.semanalStrategy);
    return this.estrategia.calcular(registros);
  }
}
