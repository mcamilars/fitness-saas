import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../../../common/decorators/current-workspace.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CommandInvokerService } from '../../../commands/command-invoker.service';
import { InvitacionesRepository } from '../../invitaciones/repositories/invitaciones.repository';
import { MailerService } from '../../mailer/mailer.service';
import { InvitarClienteCommand } from '../commands/invitar-cliente.command';
import { InvitarClienteDto } from '../dtos/invitar-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
  constructor(
    private readonly invitacionesRepository: InvitacionesRepository,
    private readonly mailer: MailerService,
    private readonly commandInvoker: CommandInvokerService,
  ) {}

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
