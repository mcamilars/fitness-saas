import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandInvokerService } from '../../../commands/command-invoker.service';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { InvitacionesRepository } from '../../invitaciones/repositories/invitaciones.repository';
import { MailerService } from '../../mailer/mailer.service';
import { DesactivarClienteCommand } from '../commands/desactivar-cliente.command';
import { InvitarClienteCommand } from '../commands/invitar-cliente.command';
import { ActualizarClienteDto } from '../dtos/actualizar-cliente.dto';
import { InvitarClienteDto } from '../dtos/invitar-cliente.dto';
import { ClientesService } from '../services/clientes.service';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(
    private readonly invitacionesRepository: InvitacionesRepository,
    private readonly mailer: MailerService,
    private readonly commandInvoker: CommandInvokerService,
    private readonly clientesService: ClientesService,
  ) {}

  @Get()
  @Roles('ENTRENADOR')
  async findAll(@CurrentWorkspace() workspaceId: string) {
    const clientes = await this.clientesService.findAllPorWorkspace(workspaceId);

    return { clientes };
  }

  @Get(':id')
  @Roles('ENTRENADOR')
  async findById(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const cliente = await this.clientesService.findById(id, workspaceId);

    return { cliente };
  }

  @Put(':id')
  @Roles('ENTRENADOR')
  async update(
    @Param('id') id: string,
    @Body() dto: ActualizarClienteDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const cliente = await this.clientesService.update(id, dto, workspaceId);

    return { cliente };
  }

  @Delete(':id')
  @Roles('ENTRENADOR')
  @HttpCode(HttpStatus.OK)
  async softDelete(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const command = new DesactivarClienteCommand(
      this.clientesService,
      id,
      workspaceId,
    );
    const cliente = await this.commandInvoker.ejecutar(command);

    return { cliente };
  }

  @Post(':id/restaurar')
  @Roles('ENTRENADOR')
  async restaurar(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const cliente = await this.clientesService.restaurar(id, workspaceId);

    return { cliente };
  }

  @Post('invitar')
  @Roles('ENTRENADOR')
  @HttpCode(HttpStatus.CREATED)
  async invitar(
    @Body() dto: InvitarClienteDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const command = new InvitarClienteCommand(
      this.invitacionesRepository,
      this.mailer,
      workspaceId,
      dto.correo,
    );

    const invitacion = await this.commandInvoker.ejecutar(command);

    return { invitacion };
  }
}
