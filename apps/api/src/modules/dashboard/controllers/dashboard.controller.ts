import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ClienteDashboardFacade } from '../cliente-dashboard.facade';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardFacade: ClienteDashboardFacade) {}

  @Get('clientes/:id/dashboard')
  @Roles('ENTRENADOR')
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
