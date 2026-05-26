import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvitacionesRepository } from '../repositories/invitaciones.repository';

@ApiTags('Invitaciones')
@Controller('invitaciones')
export class InvitacionesController {
  constructor(private readonly invitacionesRepository: InvitacionesRepository) {}

  @Get(':token/verificar')
  @ApiOperation({ summary: 'Verificar validez de un token de invitación', description: 'Endpoint público. Devuelve si la invitación es válida (no consumida y no expirada). Usado por el frontend antes de mostrar el formulario de registro.' })
  @ApiParam({ name: 'token', description: 'Token UUID de la invitación' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la verificación',
    schema: {
      example: {
        data: {
          valida: true,
          invitacion: { id: 'uuid', correo: 'cliente@email.com', espacioDeTrabajoId: 'uuid', expiraEn: '2026-06-02T00:00:00.000Z', consumida: false },
        },
      },
    },
  })
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
