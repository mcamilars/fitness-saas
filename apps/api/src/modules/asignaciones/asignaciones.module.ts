import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { AsignacionesEntrenamientoRepository } from './repositories/asignaciones-entrenamiento.repository';

@Module({
  imports: [PrismaModule],
  providers: [AsignacionesEntrenamientoRepository],
  exports: [AsignacionesEntrenamientoRepository],
})
export class AsignacionesModule {}
