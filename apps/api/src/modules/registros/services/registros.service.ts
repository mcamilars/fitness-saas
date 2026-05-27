import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AsignacionesEntrenamientoRepository } from '../../asignaciones/repositories/asignaciones-entrenamiento.repository';
import { ClientesRepository } from '../../clientes/repositories/clientes.repository';
import { RegistroEntrenamientoBuilder } from '../builders/registro-entrenamiento.builder';
import type { CrearRegistroEntrenamientoDto } from '../dtos/crear-registro-entrenamiento.dto';
import {
  type FiltrosListarRegistros,
  type ListadoRegistrosResult,
  type RegistroConEjercicios,
  RegistrosEntrenamientoRepository,
} from '../repositories/registros-entrenamiento.repository';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly registrosRepository: RegistrosEntrenamientoRepository,
    private readonly clientesRepository: ClientesRepository,
    private readonly asignacionesRepository: AsignacionesEntrenamientoRepository,
  ) {}

  async registrar(
    clienteId: string,
    workspaceId: string,
    dto: CrearRegistroEntrenamientoDto,
  ): Promise<RegistroConEjercicios> {
    const cliente = await this.clientesRepository.findByIdConPerfil(clienteId, workspaceId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (cliente.espacioDeTrabajoId !== workspaceId) {
      throw new ForbiddenException('El cliente no pertenece a este workspace');
    }

    const builder = new RegistroEntrenamientoBuilder()
      .setFecha(new Date(dto.fecha))
      .setClienteId(clienteId);

    if (dto.planDeEntrenamientoId) {
      const asignacionActiva = await this.asignacionesRepository.findActivaPorClienteYPlan(
        clienteId,
        dto.planDeEntrenamientoId,
      );

      if (!asignacionActiva) {
        throw new ForbiddenException('El cliente no tiene este plan activo asignado');
      }

      builder.setPlanDeEntrenamientoId(dto.planDeEntrenamientoId);
    }

    if (dto.duracionMin !== undefined) {
      builder.setDuracionMin(dto.duracionMin);
    }

    if (dto.notas !== undefined) {
      builder.setNotas(dto.notas);
    }

    for (const ejercicio of dto.ejercicios) {
      builder.addEjercicio(ejercicio);
    }

    const payload = builder.build();

    return this.registrosRepository.crearConEjercicios(payload);
  }

  listar(
    clienteId: string,
    filtros: FiltrosListarRegistros,
  ): Promise<ListadoRegistrosResult> {
    return this.registrosRepository.listarPorCliente(clienteId, filtros);
  }
}
