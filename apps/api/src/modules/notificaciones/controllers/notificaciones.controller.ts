import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../../common/types/authenticated-request';
import { NotificacionesService } from '../services/notificaciones.service';

@ApiTags('Notificaciones')
@ApiBearerAuth('JWT')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLIENTE')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones no leídas', description: 'Solo accesible para CLIENTE. Las notificaciones se generan via Observer cuando se asigna un plan.' })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones no leídas del cliente autenticado',
    schema: {
      example: {
        data: [
          { id: 'uuid', usuarioId: 'uuid', mensaje: 'Se te ha asignado el plan Hipertrofia 3x', leida: false, creadaEn: '2026-05-26T00:00:00.000Z' },
        ],
      },
    },
  })
  findNoLeidas(@CurrentUser() user: AuthenticatedUser) {
    return this.notificacionesService.findNoLeidasPorUsuario(user.id);
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiParam({ name: 'id', description: 'UUID de la notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída',
    schema: { example: { data: { id: 'uuid', leida: true } } },
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  marcarLeida(@Param('id') id: string) {
    return this.notificacionesService.marcarLeida(id);
  }
}
