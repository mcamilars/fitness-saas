import { Injectable, NotFoundException } from '@nestjs/common';
import { type Notificacion } from '@repo/database';
import { ClientesRepository } from '../../clientes/repositories/clientes.repository';
import { NotificacionesRepository } from '../repositories/notificaciones.repository';

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly notificacionesRepository: NotificacionesRepository,
    private readonly clientesRepository: ClientesRepository,
  ) {}

  async findNoLeidasPorUsuario(usuarioId: string): Promise<Notificacion[]> {
    const cliente = await this.clientesRepository.findByUsuarioId(usuarioId);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return this.notificacionesRepository.findNoLeidasPorCliente(cliente.id);
  }

  marcarLeida(id: string): Promise<Notificacion> {
    return this.notificacionesRepository.marcarLeida(id);
  }
}
