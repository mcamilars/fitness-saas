import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { ClientesModule } from '../clientes/clientes.module';
import { RegistrosController } from './controllers/registros.controller';
import { RegistrosEntrenamientoRepository } from './repositories/registros-entrenamiento.repository';
import { RegistrosService } from './services/registros.service';

@Module({
  imports: [PrismaModule, ClientesModule],
  controllers: [RegistrosController],
  providers: [RegistrosEntrenamientoRepository, RegistrosService],
  exports: [RegistrosEntrenamientoRepository, RegistrosService],
})
export class RegistrosModule {}
