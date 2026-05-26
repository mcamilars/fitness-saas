import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ProgresoQueryDto } from '../dtos/progreso-query.dto';
import { ProgresoService } from '../services/progreso.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Get('clientes/:id/progreso')
  @Roles('ENTRENADOR', 'CLIENTE')
  async getProgreso(
    @Param('id') clienteId: string,
    @Query() query: ProgresoQueryDto,
    @CurrentWorkspace() _workspaceId: string,
  ) {
    const progreso = await this.progresoService.calcularProgreso(
      clienteId,
      query.vista ?? 'semanal',
    );

    return { progreso };
  }
}
