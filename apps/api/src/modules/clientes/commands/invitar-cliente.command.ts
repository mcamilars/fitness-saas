import { randomUUID } from 'node:crypto';
import { type Invitacion } from '@repo/database';
import { type Command } from '../../../commands/command.interface';
import { type InvitacionesRepository } from '../../invitaciones/repositories/invitaciones.repository';
import { type MailerService } from '../../mailer/mailer.service';

const MILISEGUNDOS_24_HORAS = 24 * 60 * 60 * 1000;

export class InvitarClienteCommand implements Command<Invitacion> {
  private invitacionId?: string;
  private token?: string;

  constructor(
    private readonly invitacionesRepository: InvitacionesRepository,
    private readonly mailer: MailerService,
    private readonly workspaceId: string,
    private readonly correo: string,
  ) {}

  async execute(): Promise<Invitacion> {
    const token = randomUUID();
    const invitacion = await this.invitacionesRepository.crear({
      espacioDeTrabajoId: this.workspaceId,
      correo: this.correo,
      token,
      expiraEn: new Date(Date.now() + MILISEGUNDOS_24_HORAS),
    });

    this.invitacionId = invitacion.id;
    this.token = token;
    await this.mailer.enviarInvitacion(this.correo, token);

    return invitacion;
  }

  async undo(): Promise<void> {
    if (!this.invitacionId) {
      return;
    }

    await this.invitacionesRepository.marcarConsumidaPorId(this.invitacionId);
  }

  descripcion(): string {
    return `Invitar cliente ${this.correo} al workspace ${this.workspaceId}`;
  }

  getToken(): string | undefined {
    return this.token;
  }
}
