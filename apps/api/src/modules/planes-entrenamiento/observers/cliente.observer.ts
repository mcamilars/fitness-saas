import type { NotificacionesRepository } from '../../notificaciones/repositories/notificaciones.repository';
import type { EventoPlan, Observer } from './subject.interface';

export class ClienteObserver implements Observer {
  constructor(
    private readonly notificacionesRepository: NotificacionesRepository,
    private readonly clienteId: string,
  ) {}

  async update(evento: EventoPlan): Promise<void> {
    await this.notificacionesRepository.crear({
      clienteId: evento.clienteId ?? this.clienteId,
      mensaje: this.crearMensaje(evento),
    });
  }

  private crearMensaje(evento: EventoPlan): string {
    const mensajes: Record<EventoPlan['tipo'], string> = {
      PLAN_ACTIVADO: 'Tu plan de entrenamiento fue activado.',
      PLAN_MODIFICADO: 'Tu plan de entrenamiento fue modificado.',
      PLAN_ARCHIVADO: 'Tu plan de entrenamiento fue archivado.',
    };

    return mensajes[evento.tipo];
  }
}
