import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AsignarEntrenamientoDto } from '../dtos/asignar-entrenamiento.dto';
import { CambiarEstadoAsignacionDto } from '../dtos/cambiar-estado-asignacion.dto';
import { AsignacionesEntrenamientoRepository } from '../repositories/asignaciones-entrenamiento.repository';
import { AsignacionesService } from '../services/asignaciones.service';

@ApiTags('Asignaciones')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENTRENADOR')
export class AsignacionesController {
  constructor(
    private readonly asignacionesService: AsignacionesService,
    private readonly asignacionesRepository: AsignacionesEntrenamientoRepository,
  ) {}

  @Post('asignaciones/entrenamiento')
  @ApiOperation({ summary: 'Asignar un plan de entrenamiento a un cliente', description: 'Crea una asignación ACTIVA entre un cliente y un plan. Notifica al cliente via Observer.' })
  @ApiResponse({
    status: 201,
    description: 'Asignación creada',
    schema: { example: { data: { id: 'uuid', clienteId: 'uuid', planEntrenamientoId: 'uuid', estado: 'ACTIVO', asignadoEn: '2026-05-26T00:00:00.000Z' } } },
  })
  @ApiResponse({ status: 404, description: 'Cliente o plan no encontrado' })
  asignarEntrenamiento(
    @Body() dto: AsignarEntrenamientoDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.asignacionesService.asignarEntrenamiento(dto, workspaceId);
  }

  @Get('clientes/:id/asignaciones')
  @ApiOperation({ summary: 'Listar asignaciones de un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Asignaciones del cliente',
    schema: { example: { data: [{ id: 'uuid', planEntrenamientoId: 'uuid', estado: 'ACTIVO', asignadoEn: '2026-05-26T00:00:00.000Z' }] } },
  })
  findPorCliente(@Param('id') clienteId: string) {
    return this.asignacionesRepository.findPorCliente(clienteId);
  }

  @Put('asignaciones/:id')
  @ApiOperation({ summary: 'Cambiar estado de una asignación', description: 'Permite activar o desactivar una asignación existente.' })
  @ApiParam({ name: 'id', description: 'UUID de la asignación' })
  @ApiResponse({
    status: 200,
    description: 'Asignación actualizada',
    schema: { example: { data: { id: 'uuid', estado: 'INACTIVO' } } },
  })
  @ApiResponse({ status: 404, description: 'Asignación no encontrada' })
  cambiarEstado(
    @Param('id') asignacionId: string,
    @Body() dto: CambiarEstadoAsignacionDto,
  ) {
    return this.asignacionesService.cambiarEstado(asignacionId, dto.estado);
  }
}
