import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ClienteDashboardFacade } from '../cliente-dashboard.facade';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardFacade: ClienteDashboardFacade) {}

  @Get('clientes/:id/dashboard')
  @Roles('ENTRENADOR')
  @ApiOperation({
    summary: 'Obtener dashboard completo de un cliente',
    description: 'Agrega en una sola llamada: datos del cliente, plan activo, asignaciones y últimos registros. Implementado con el patrón Facade.',
  })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard del cliente',
    schema: {
      example: {
        data: {
          dashboard: {
            cliente: { id: 'uuid', estaActivo: true },
            planActivo: { id: 'uuid', nombre: 'Hipertrofia 3x', estado: 'ACTIVO' },
            asignaciones: [{ id: 'uuid', estado: 'ACTIVO' }],
            ultimosRegistros: [{ id: 'uuid', fecha: '2026-05-26T00:00:00.000Z', duracionMin: 60 }],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado en el workspace' })
  async getDashboard(
    @Param('id') clienteId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const dashboard = await this.dashboardFacade.getDashboardCliente(
      clienteId,
      workspaceId,
    );

    return { dashboard };
  }
}
