import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommandInvokerService } from '../../../commands/command-invoker.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../../common/types/authenticated-request';
import { ArchivarPlanCommand } from '../commands/archivar-plan.command';
import { AgregarEjercicioPlanDto } from '../dtos/agregar-ejercicio-plan.dto';
import { CrearPlanEntrenamientoDto } from '../dtos/crear-plan-entrenamiento.dto';
import { PlanesEntrenamientoService } from '../services/planes-entrenamiento.service';

@ApiTags('Planes de Entrenamiento')
@ApiBearerAuth('JWT')
@Controller('planes-entrenamiento')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENTRENADOR')
export class PlanesEntrenamientoController {
  constructor(
    private readonly planesEntrenamientoService: PlanesEntrenamientoService,
    private readonly commandInvoker: CommandInvokerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un plan de entrenamiento', description: 'Usa Factory + State internamente. El plan se crea en estado BORRADOR.' })
  @ApiResponse({
    status: 201,
    description: 'Plan creado en estado BORRADOR',
    schema: { example: { data: { id: 'uuid', nombre: 'Hipertrofia 3x', tipo: 'HIPERTROFIA', estado: 'BORRADOR', entrenadorId: 'uuid', ejercicios: [] } } },
  })
  crear(
    @Body() dto: CrearPlanEntrenamientoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planesEntrenamientoService.crearParaUsuario(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar planes del workspace' })
  @ApiResponse({
    status: 200,
    description: 'Planes del workspace',
    schema: { example: { data: [{ id: 'uuid', nombre: 'Hipertrofia 3x', tipo: 'HIPERTROFIA', estado: 'ACTIVO' }] } },
  })
  findAll(@CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.findAll(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un plan por ID (con ejercicios)' })
  @ApiParam({ name: 'id', description: 'UUID del plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan con lista de ejercicios',
    schema: { example: { data: { id: 'uuid', nombre: 'Hipertrofia 3x', estado: 'ACTIVO', ejercicios: [{ ejercicioId: 'uuid', series: 4, repeticiones: 10, orden: 1 }] } } },
  })
  @ApiResponse({ status: 404, description: 'Plan no encontrado en el workspace' })
  findById(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.findById(id, workspaceId);
  }

  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar un plan (BORRADOR → ACTIVO)', description: 'Transición de estado via patrón State. Solo funciona si el plan está en BORRADOR.' })
  @ApiParam({ name: 'id', description: 'UUID del plan' })
  @ApiResponse({ status: 200, description: 'Plan activado', schema: { example: { data: { id: 'uuid', estado: 'ACTIVO' } } } })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  activar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.activar(id, workspaceId);
  }

  @Patch(':id/archivar')
  @ApiOperation({ summary: 'Archivar un plan (ACTIVO → ARCHIVADO)', description: 'Usa el patrón Command para poder deshacerse con POST /api/commands/undo.' })
  @ApiParam({ name: 'id', description: 'UUID del plan' })
  @ApiResponse({ status: 200, description: 'Plan archivado', schema: { example: { data: { id: 'uuid', estado: 'ARCHIVADO' } } } })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  archivar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    const command = new ArchivarPlanCommand(
      this.planesEntrenamientoService,
      id,
      workspaceId,
    );

    return this.commandInvoker.ejecutar(command);
  }

  @Post(':id/duplicar')
  @ApiOperation({ summary: 'Duplicar un plan existente (Prototype)', description: 'Crea una copia del plan con todos sus ejercicios en estado BORRADOR.' })
  @ApiParam({ name: 'id', description: 'UUID del plan a duplicar' })
  @ApiResponse({
    status: 201,
    description: 'Copia del plan creada',
    schema: { example: { data: { id: 'uuid-nuevo', nombre: 'Copia de Hipertrofia 3x', estado: 'BORRADOR', ejercicios: [] } } },
  })
  duplicar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.duplicar(id, workspaceId);
  }

  @Post(':id/ejercicios')
  @ApiOperation({ summary: 'Agregar un ejercicio al plan' })
  @ApiParam({ name: 'id', description: 'UUID del plan' })
  @ApiResponse({
    status: 201,
    description: 'Ejercicio agregado al plan',
    schema: { example: { data: { id: 'uuid', planEntrenamientoId: 'uuid', ejercicioId: 'uuid', series: 4, repeticiones: 10, orden: 1 } } },
  })
  agregarEjercicio(
    @Param('id') id: string,
    @Body() dto: AgregarEjercicioPlanDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.planesEntrenamientoService.agregarEjercicio(
      id,
      dto,
      workspaceId,
    );
  }

  @Delete(':id/ejercicios/:ejercicioPlanId')
  @ApiOperation({ summary: 'Quitar un ejercicio del plan' })
  @ApiParam({ name: 'id', description: 'UUID del plan' })
  @ApiParam({ name: 'ejercicioPlanId', description: 'UUID del ejercicio-plan (la entrada en la tabla intermedia)' })
  @ApiResponse({ status: 200, description: 'Ejercicio eliminado del plan', schema: { example: { data: { id: 'uuid' } } } })
  @ApiResponse({ status: 404, description: 'Ejercicio-plan no encontrado' })
  quitarEjercicio(
    @Param('id') id: string,
    @Param('ejercicioPlanId') ejercicioPlanId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.planesEntrenamientoService.quitarEjercicio(
      id,
      ejercicioPlanId,
      workspaceId,
    );
  }
}
