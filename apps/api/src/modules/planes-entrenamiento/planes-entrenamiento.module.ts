import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { EntrenadoresModule } from '../entrenadores/entrenadores.module';
import { PlanesEntrenamientoController } from './controllers/planes-entrenamiento.controller';
import { PlanFactoriesProvider } from './factories/plan-factory.provider';
import { PlanSubject } from './observers/plan-subject.service';
import { PlanesEntrenamientoRepository } from './repositories/planes-entrenamiento.repository';
import { PlanesEntrenamientoService } from './services/planes-entrenamiento.service';
import { PlanStateFactory } from './states/state.factory';

@Module({
  imports: [PrismaModule, EntrenadoresModule],
  controllers: [PlanesEntrenamientoController],
  providers: [
    PlanesEntrenamientoRepository,
    PlanFactoriesProvider,
    PlanStateFactory,
    PlanSubject,
    PlanesEntrenamientoService,
  ],
  exports: [
    PlanesEntrenamientoRepository,
    PlanFactoriesProvider,
    PlanStateFactory,
    PlanSubject,
    PlanesEntrenamientoService,
  ],
})
export class PlanesEntrenamientoModule {}
