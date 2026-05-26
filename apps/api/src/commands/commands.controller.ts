import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommandInvokerService } from './command-invoker.service';

@Controller('commands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommandsController {
  constructor(private readonly commandInvoker: CommandInvokerService) {}

  @Post('undo')
  @Roles('ENTRENADOR')
  @HttpCode(HttpStatus.OK)
  async undo() {
    await this.commandInvoker.deshacerUltimo();
    return { mensaje: 'Último comando deshecho' };
  }
}
