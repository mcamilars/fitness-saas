import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { PlanFactoriesProvider } from './factories/plan-factory.provider';
import { PlanesEntrenamientoRepository } from './repositories/planes-entrenamiento.repository';

@Module({
  imports: [PrismaModule],
  providers: [PlanesEntrenamientoRepository, PlanFactoriesProvider],
  exports: [PlanesEntrenamientoRepository, PlanFactoriesProvider],
})
export class PlanesEntrenamientoModule {}
