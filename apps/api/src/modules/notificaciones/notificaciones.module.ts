import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { ClientesModule } from '../clientes/clientes.module';
import { NotificacionesController } from './controllers/notificaciones.controller';
import { NotificacionesRepository } from './repositories/notificaciones.repository';
import { NotificacionesService } from './services/notificaciones.service';

@Module({
  imports: [PrismaModule, ClientesModule],
  controllers: [NotificacionesController],
  providers: [NotificacionesRepository, NotificacionesService],
  exports: [NotificacionesRepository, NotificacionesService],
})
export class NotificacionesModule {}
