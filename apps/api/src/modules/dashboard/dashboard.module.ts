import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { PlanesEntrenamientoModule } from '../planes-entrenamiento/planes-entrenamiento.module';
import { ProgresoModule } from '../progreso/progreso.module';
import { RegistrosModule } from '../registros/registros.module';
import { ClienteDashboardFacade } from './cliente-dashboard.facade';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    ClientesModule,
    PlanesEntrenamientoModule,
    RegistrosModule,
    ProgresoModule,
  ],
  controllers: [DashboardController],
  providers: [ClienteDashboardFacade],
})
export class DashboardModule {}
