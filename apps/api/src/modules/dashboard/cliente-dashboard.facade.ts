import { Injectable } from '@nestjs/common';
import { EstadoPlan } from '@repo/database';
import { ClientesService } from '../clientes/services/clientes.service';
import { PlanesEntrenamientoService } from '../planes-entrenamiento/services/planes-entrenamiento.service';
import type { ProgresoResumen } from '../progreso/strategies/progreso-strategy.interface';
import { ProgresoService } from '../progreso/services/progreso.service';
import { RegistrosService } from '../registros/services/registros.service';
import type { ClienteConPerfil } from '../clientes/repositories/clientes.repository';
import type { PlanConEjercicios } from '../planes-entrenamiento/repositories/planes-entrenamiento.repository';
import type { RegistroConEjercicios } from '../registros/repositories/registros-entrenamiento.repository';

export interface ClienteDashboard {
  cliente: ClienteConPerfil;
  planActivo: PlanConEjercicios | null;
  ultimosRegistros: RegistroConEjercicios[];
  progresoSemanal: ProgresoResumen;
}

@Injectable()
export class ClienteDashboardFacade {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly planesService: PlanesEntrenamientoService,
    private readonly registrosService: RegistrosService,
    private readonly progresoService: ProgresoService,
  ) {}

  async getDashboardCliente(
    clienteId: string,
    workspaceId: string,
  ): Promise<ClienteDashboard> {
    const [cliente, planes, registrosResult, progresoSemanal] = await Promise.all([
      this.clientesService.findById(clienteId, workspaceId),
      this.planesService.findAll(workspaceId),
      this.registrosService.listar(clienteId, { page: 1, limit: 5 }),
      this.progresoService.calcularProgreso(clienteId, 'semanal'),
    ]);

    const planActivo = planes.find((p) => p.estado === EstadoPlan.ACTIVO) ?? null;

    return {
      cliente,
      planActivo,
      ultimosRegistros: registrosResult.registros,
      progresoSemanal,
    };
  }
}
