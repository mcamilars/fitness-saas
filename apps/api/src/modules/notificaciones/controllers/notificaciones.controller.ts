import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../../common/types/authenticated-request';
import { NotificacionesService } from '../services/notificaciones.service';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLIENTE')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  findNoLeidas(@CurrentUser() user: AuthenticatedUser) {
    return this.notificacionesService.findNoLeidasPorUsuario(user.id);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id') id: string) {
    return this.notificacionesService.marcarLeida(id);
  }
}
