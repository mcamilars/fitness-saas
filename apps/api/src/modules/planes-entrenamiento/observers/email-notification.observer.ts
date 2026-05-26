import type { MailerService } from '../../mailer/mailer.service';
import type { EventoPlan, Observer } from './subject.interface';

export class EmailNotificationObserver implements Observer {
  constructor(
    private readonly mailer: MailerService,
    private readonly correoCliente: string,
  ) {}

  async update(evento: EventoPlan): Promise<void> {
    await this.mailer.enviarCambioPlan(
      this.correoCliente,
      this.crearMensaje(evento),
    );
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
