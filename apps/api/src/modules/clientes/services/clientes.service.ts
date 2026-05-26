import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteContainer } from '../memento/cliente-container';
import type { ClienteSnapshot } from '../memento/cliente.memento';
import {
  type ActualizarClienteDto,
  type ClienteConPerfil,
  ClientesRepository,
} from '../repositories/clientes.repository';

@Injectable()
export class ClientesService {
  constructor(
    private readonly clientesRepository: ClientesRepository,
    private readonly clienteContainer: ClienteContainer,
  ) {}

  findAllPorWorkspace(workspaceId: string): Promise<ClienteConPerfil[]> {
    return this.clientesRepository.findAllPorWorkspace(workspaceId);
  }

  async findById(
    id: string,
    workspaceId: string,
  ): Promise<ClienteConPerfil> {
    const cliente = await this.clientesRepository.findByIdConPerfil(id);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    this.validarWorkspace(cliente, workspaceId);

    return cliente;
  }

  async update(
    id: string,
    dto: ActualizarClienteDto,
    workspaceId: string,
  ): Promise<ClienteConPerfil> {
    await this.findById(id, workspaceId);

    const clienteActualizado = await this.clientesRepository.update(
      id,
      dto,
      workspaceId,
    );

    if (!clienteActualizado) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return clienteActualizado;
  }

  async softDelete(
    id: string,
    workspaceId: string,
  ): Promise<ClienteConPerfil> {
    const cliente = await this.findById(id, workspaceId);

    this.clienteContainer.guardar(id, this.crearSnapshot(cliente));

    const clienteDesactivado = await this.clientesRepository.setActivo(
      id,
      false,
      workspaceId,
    );

    if (!clienteDesactivado) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return clienteDesactivado;
  }

  async restaurar(
    id: string,
    workspaceId: string,
  ): Promise<ClienteConPerfil> {
    await this.findById(id, workspaceId);

    const memento = this.clienteContainer.restaurarUltimo(id);
    if (!memento) {
      throw new NotFoundException('No existe un estado previo para restaurar');
    }

    const snapshot = memento.getEstado();
    if (snapshot.espacioDeTrabajoId !== workspaceId) {
      throw new ForbiddenException('El cliente no pertenece a este workspace');
    }

    const clienteRestaurado = await this.clientesRepository.setActivo(
      id,
      true,
      workspaceId,
    );

    if (!clienteRestaurado) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return clienteRestaurado;
  }

  private validarWorkspace(cliente: ClienteConPerfil, workspaceId: string): void {
    if (cliente.espacioDeTrabajoId !== workspaceId) {
      throw new ForbiddenException('El cliente no pertenece a este workspace');
    }
  }

  private crearSnapshot(cliente: ClienteConPerfil): ClienteSnapshot {
    return {
      id: cliente.id,
      usuarioId: cliente.usuarioId,
      entrenadorId: cliente.entrenadorId,
      espacioDeTrabajoId: cliente.espacioDeTrabajoId,
      estaActivo: cliente.estaActivo,
      creadoEn: cliente.creadoEn.toISOString(),
      actualizadoEn: cliente.actualizadoEn.toISOString(),
    };
  }
}
