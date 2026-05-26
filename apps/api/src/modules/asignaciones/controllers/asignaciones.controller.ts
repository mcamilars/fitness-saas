import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AsignarEntrenamientoDto } from '../dtos/asignar-entrenamiento.dto';
import { CambiarEstadoAsignacionDto } from '../dtos/cambiar-estado-asignacion.dto';
import { AsignacionesEntrenamientoRepository } from '../repositories/asignaciones-entrenamiento.repository';
import { AsignacionesService } from '../services/asignaciones.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENTRENADOR')
export class AsignacionesController {
  constructor(
    private readonly asignacionesService: AsignacionesService,
    private readonly asignacionesRepository: AsignacionesEntrenamientoRepository,
  ) {}

  @Post('asignaciones/entrenamiento')
  asignarEntrenamiento(
    @Body() dto: AsignarEntrenamientoDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.asignacionesService.asignarEntrenamiento(dto, workspaceId);
  }

  @Get('clientes/:id/asignaciones')
  findPorCliente(@Param('id') clienteId: string) {
    return this.asignacionesRepository.findPorCliente(clienteId);
  }

  @Put('asignaciones/:id')
  cambiarEstado(
    @Param('id') asignacionId: string,
    @Body() dto: CambiarEstadoAsignacionDto,
  ) {
    return this.asignacionesService.cambiarEstado(asignacionId, dto.estado);
  }
}
