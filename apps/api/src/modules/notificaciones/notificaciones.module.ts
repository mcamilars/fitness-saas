import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { NotificacionesRepository } from './repositories/notificaciones.repository';

@Module({
  imports: [PrismaModule],
  providers: [NotificacionesRepository],
  exports: [NotificacionesRepository],
})
export class NotificacionesModule {}
