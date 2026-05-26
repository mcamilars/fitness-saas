import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { PlanesEntrenamientoRepository } from './repositories/planes-entrenamiento.repository';

@Module({
  imports: [PrismaModule],
  providers: [PlanesEntrenamientoRepository],
  exports: [PlanesEntrenamientoRepository],
})
export class PlanesEntrenamientoModule {}
