import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ProgresoQueryDto } from '../dtos/progreso-query.dto';
import { ProgresoService } from '../services/progreso.service';

@ApiTags('Progreso')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Get('clientes/:id/progreso')
  @Roles('ENTRENADOR', 'CLIENTE')
  @ApiOperation({
    summary: 'Calcular progreso de un cliente',
    description: 'Aplica una estrategia de análisis (semanal, mensual o por plan) usando el patrón Strategy. Accesible para ENTRENADOR y CLIENTE.',
  })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiQuery({ name: 'vista', required: false, enum: ['semanal', 'mensual', 'porPlan'], example: 'semanal' })
  @ApiResponse({
    status: 200,
    description: 'Resumen del progreso según la vista solicitada',
    schema: {
      example: {
        data: {
          progreso: {
            vista: 'semanal',
            sesiones: 3,
            volumenTotal: 4800,
            ejerciciosMasFrecuentes: [{ nombre: 'Press de banca', veces: 3 }],
          },
        },
      },
    },
  })
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
