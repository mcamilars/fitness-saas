import { Controller, Get, Param } from '@nestjs/common';
import { InvitacionesRepository } from '../repositories/invitaciones.repository';

@Controller('invitaciones')
export class InvitacionesController {
  constructor(private readonly invitacionesRepository: InvitacionesRepository) {}

  @Get(':token/verificar')
  async verificar(@Param('token') token: string) {
    const invitacion = await this.invitacionesRepository.findByToken(token);

    if (!invitacion) {
      return { valida: false, invitacion: null };
    }

    const expirada = invitacion.expiraEn.getTime() <= Date.now();
    const valida = !invitacion.consumida && !expirada;

    return {
      valida,
      invitacion: {
        id: invitacion.id,
        correo: invitacion.correo,
        espacioDeTrabajoId: invitacion.espacioDeTrabajoId,
        expiraEn: invitacion.expiraEn,
        consumida: invitacion.consumida,
      },
    };
  }
}
