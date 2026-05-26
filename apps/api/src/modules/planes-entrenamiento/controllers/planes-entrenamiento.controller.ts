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

@Controller('planes-entrenamiento')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ENTRENADOR')
export class PlanesEntrenamientoController {
  constructor(
    private readonly planesEntrenamientoService: PlanesEntrenamientoService,
    private readonly commandInvoker: CommandInvokerService,
  ) {}

  @Post()
  crear(
    @Body() dto: CrearPlanEntrenamientoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planesEntrenamientoService.crearParaUsuario(dto, user.id);
  }

  @Get()
  findAll(@CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.findAll(workspaceId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.findById(id, workspaceId);
  }

  @Patch(':id/activar')
  activar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.activar(id, workspaceId);
  }

  @Patch(':id/archivar')
  archivar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    const command = new ArchivarPlanCommand(
      this.planesEntrenamientoService,
      id,
      workspaceId,
    );

    return this.commandInvoker.ejecutar(command);
  }

  @Post(':id/duplicar')
  duplicar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.planesEntrenamientoService.duplicar(id, workspaceId);
  }

  @Post(':id/ejercicios')
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
