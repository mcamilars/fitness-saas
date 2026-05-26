import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { PlanFactoriesProvider } from './factories/plan-factory.provider';
import { PlanesEntrenamientoRepository } from './repositories/planes-entrenamiento.repository';
import { PlanStateFactory } from './states/state.factory';

@Module({
  imports: [PrismaModule],
  providers: [PlanesEntrenamientoRepository, PlanFactoriesProvider, PlanStateFactory],
  exports: [PlanesEntrenamientoRepository, PlanFactoriesProvider, PlanStateFactory],
})
export class PlanesEntrenamientoModule {}
