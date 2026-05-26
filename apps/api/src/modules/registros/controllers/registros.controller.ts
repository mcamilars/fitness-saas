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
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CrearRegistroEntrenamientoDto } from '../dtos/crear-registro-entrenamiento.dto';
import { ListarRegistrosDto } from '../dtos/listar-registros.dto';
import { RegistrosService } from '../services/registros.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post('clientes/:id/registros-entrenamiento')
  @Roles('ENTRENADOR', 'CLIENTE')
  @HttpCode(HttpStatus.CREATED)
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
