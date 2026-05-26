import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { CommandsModule } from '../../commands/commands.module';
import { InvitacionesModule } from '../invitaciones/invitaciones.module';
import { MailerModule } from '../mailer/mailer.module';
import { ClientesController } from './controllers/clientes.controller';
import { ClientesRepository } from './repositories/clientes.repository';

@Module({
  imports: [PrismaModule, InvitacionesModule, MailerModule, CommandsModule],
  controllers: [ClientesController],
  providers: [ClientesRepository],
  exports: [ClientesRepository],
})
export class ClientesModule {}
