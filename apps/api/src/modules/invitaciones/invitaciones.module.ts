import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { InvitacionesController } from './controllers/invitaciones.controller';
import { InvitacionesRepository } from './repositories/invitaciones.repository';

@Module({
  imports: [PrismaModule],
  controllers: [InvitacionesController],
  providers: [InvitacionesRepository],
  exports: [InvitacionesRepository],
})
export class InvitacionesModule {}
