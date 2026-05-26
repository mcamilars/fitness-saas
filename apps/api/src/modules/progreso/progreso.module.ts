import { Module } from '@nestjs/common';
import { AsignacionesModule } from '../asignaciones/asignaciones.module';
import { RegistrosModule } from '../registros/registros.module';
import { ProgresoController } from './controllers/progreso.controller';
import { ProgresoService } from './services/progreso.service';
import { ProgresoMensualStrategy } from './strategies/progreso-mensual.strategy';
import { ProgresoPorPlanStrategy } from './strategies/progreso-por-plan.strategy';
import { ProgresoSemanalStrategy } from './strategies/progreso-semanal.strategy';

@Module({
  imports: [RegistrosModule, AsignacionesModule],
  controllers: [ProgresoController],
  providers: [
    ProgresoSemanalStrategy,
    ProgresoMensualStrategy,
    ProgresoPorPlanStrategy,
    ProgresoService,
  ],
  exports: [ProgresoService],
})
export class ProgresoModule {}
