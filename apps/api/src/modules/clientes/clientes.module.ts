import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { CommandsModule } from '../../commands/commands.module';
import { InvitacionesModule } from '../invitaciones/invitaciones.module';
import { MailerModule } from '../mailer/mailer.module';
import { ClientesController } from './controllers/clientes.controller';
import { ClienteContainer } from './memento/cliente-container';
import { ClientesRepository } from './repositories/clientes.repository';
import { ClientesService } from './services/clientes.service';

@Module({
  imports: [PrismaModule, InvitacionesModule, MailerModule, CommandsModule],
  controllers: [ClientesController],
  providers: [ClientesRepository, ClienteContainer, ClientesService],
  exports: [ClientesRepository, ClienteContainer, ClientesService],
})
export class ClientesModule {}
