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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Clientes')
@ApiBearerAuth('JWT')
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
  @ApiOperation({ summary: 'Listar clientes del workspace', description: 'Devuelve todos los clientes registrados en el espacio de trabajo del entrenador autenticado.' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes',
    schema: { example: { data: { clientes: [{ id: 'uuid', usuarioId: 'uuid', espacioDeTrabajoId: 'uuid', estaActivo: true }] } } },
  })
  async findAll(@CurrentWorkspace() workspaceId: string) {
    const clientes = await this.clientesService.findAllPorWorkspace(workspaceId);

    return { clientes };
  }

  @Get(':id')
  @Roles('ENTRENADOR')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    schema: { example: { data: { cliente: { id: 'uuid', usuarioId: 'uuid', estaActivo: true } } } },
  })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado en el workspace' })
  async findById(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const cliente = await this.clientesService.findById(id, workspaceId);

    return { cliente };
  }

  @Put(':id')
  @Roles('ENTRENADOR')
  @ApiOperation({ summary: 'Actualizar datos de un cliente', description: 'Actualmente permite cambiar el campo `estaActivo`.' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado',
    schema: { example: { data: { cliente: { id: 'uuid', estaActivo: false } } } },
  })
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
  @ApiOperation({ summary: 'Desactivar un cliente (soft delete)', description: 'Marca al cliente como inactivo mediante el patrón Command (permite deshacer con POST /api/commands/undo).' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 200,
    description: 'Cliente desactivado',
    schema: { example: { data: { cliente: { id: 'uuid', estaActivo: false } } } },
  })
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
  @ApiOperation({ summary: 'Restaurar un cliente desactivado' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente reactivado',
    schema: { example: { data: { cliente: { id: 'uuid', estaActivo: true } } } },
  })
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
  @ApiOperation({ summary: 'Invitar un cliente por correo', description: 'Genera un token de invitación, lo persiste y envía un correo. Usa el patrón Command (permite deshacer).' })
  @ApiResponse({
    status: 201,
    description: 'Invitación enviada',
    schema: { example: { data: { invitacion: { id: 'uuid', correo: 'cliente@email.com', token: 'abc123', expiraEn: '2026-06-02T00:00:00.000Z', consumida: false } } } },
  })
  @ApiResponse({ status: 409, description: 'Ya existe una invitación pendiente para ese correo' })
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
