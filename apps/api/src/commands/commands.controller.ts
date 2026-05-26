import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommandInvokerService } from './command-invoker.service';

@ApiTags('Commands')
@ApiBearerAuth('JWT')
@Controller('commands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandsController {
  constructor(private readonly commandInvoker: CommandInvokerService) {}

  @Post('undo')
  @Roles('ENTRENADOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deshacer el último comando ejecutado',
    description: 'Invoca `undo()` sobre el último comando del historial (máx. 50). Soporta: DesactivarCliente, InvitarCliente, ArchivarPlan. Solo accesible para ENTRENADOR.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comando deshecho',
    schema: { example: { data: { mensaje: 'Último comando deshecho' } } },
  })
  @ApiResponse({ status: 400, description: 'No hay comandos que deshacer' })
  async undo() {
    await this.commandInvoker.deshacerUltimo();
    return { mensaje: 'Último comando deshecho' };
  }
}
