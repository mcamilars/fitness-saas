import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CrearRegistroEntrenamientoDto } from '../dtos/crear-registro-entrenamiento.dto';
import { ListarRegistrosDto } from '../dtos/listar-registros.dto';
import { RegistrosService } from '../services/registros.service';

@ApiTags('Registros de Entrenamiento')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post('clientes/:id/registros-entrenamiento')
  @Roles('ENTRENADOR', 'CLIENTE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una sesión de entrenamiento', description: 'Construye el registro usando el patrón Builder. Accesible para ENTRENADOR y CLIENTE.' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 201,
    description: 'Registro creado',
    schema: {
      example: {
        data: {
          registro: {
            id: 'uuid', clienteId: 'uuid', fecha: '2026-05-26T00:00:00.000Z', duracionMin: 60, notas: null,
            ejercicios: [{ nombre: 'Press de banca', grupoMuscular: 'PECHO', series: 4, repeticiones: 10, pesoKg: 80 }],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado en el workspace' })
  async registrar(
    @Param('id') clienteId: string,
    @Body() dto: CrearRegistroEntrenamientoDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const registro = await this.registrosService.registrar(clienteId, workspaceId, dto);

    return { registro };
  }

  @Get('clientes/:id/registros-entrenamiento')
  @Roles('ENTRENADOR', 'CLIENTE')
  @ApiOperation({ summary: 'Listar registros de entrenamiento de un cliente', description: 'Soporta paginación y filtro por rango de fechas.' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'desde', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'hasta', required: false, example: '2026-05-31' })
  @ApiResponse({
    status: 200,
    description: 'Registros paginados',
    schema: {
      example: {
        data: {
          registros: [{ id: 'uuid', fecha: '2026-05-26T00:00:00.000Z', duracionMin: 60, ejercicios: [] }],
          total: 1, page: 1, limit: 20,
        },
      },
    },
  })
  async listar(
    @Param('id') clienteId: string,
    @Query() query: ListarRegistrosDto,
  ) {
    const filtros = {
      page: query.page,
      limit: query.limit,
      desde: query.desde ? new Date(query.desde) : undefined,
      hasta: query.hasta ? new Date(query.hasta) : undefined,
    };

    return this.registrosService.listar(clienteId, filtros);
  }
}
