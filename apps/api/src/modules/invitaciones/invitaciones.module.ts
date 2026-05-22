import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { InvitacionesRepository } from './repositories/invitaciones.repository';

@Module({
  imports: [PrismaModule],
  providers: [InvitacionesRepository],
  exports: [InvitacionesRepository],
})
export class InvitacionesModule {}
