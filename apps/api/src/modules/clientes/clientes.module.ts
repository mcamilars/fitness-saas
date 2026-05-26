import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { CommandsModule } from '../../commands/commands.module';
import { InvitacionesModule } from '../invitaciones/invitaciones.module';
import { MailerModule } from '../mailer/mailer.module';
import { ClientesController } from './controllers/clientes.controller';
import { ClienteContainer } from './memento/cliente-container';
import { ClientesRepository } from './repositories/clientes.repository';

@Module({
  imports: [PrismaModule, InvitacionesModule, MailerModule, CommandsModule],
  controllers: [ClientesController],
  providers: [ClientesRepository, ClienteContainer],
  exports: [ClientesRepository, ClienteContainer],
})
export class ClientesModule {}
