import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { ClientesModule } from '../clientes/clientes.module';
import { MailerModule } from '../mailer/mailer.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { PlanesEntrenamientoModule } from '../planes-entrenamiento/planes-entrenamiento.module';
import { AsignacionesController } from './controllers/asignaciones.controller';
import { AsignacionesEntrenamientoRepository } from './repositories/asignaciones-entrenamiento.repository';
import { AsignacionesService } from './services/asignaciones.service';

@Module({
  imports: [
    PrismaModule,
    ClientesModule,
    NotificacionesModule,
    PlanesEntrenamientoModule,
    MailerModule,
  ],
  controllers: [AsignacionesController],
  providers: [AsignacionesEntrenamientoRepository, AsignacionesService],
  exports: [AsignacionesEntrenamientoRepository, AsignacionesService],
})
export class AsignacionesModule {}
