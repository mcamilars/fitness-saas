import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { EjerciciosController } from './controllers/ejercicios.controller';
import { CacheEjerciciosDecorator } from './decorators/cache-ejercicios.decorator';
import { EjerciciosRepository } from './repositories/ejercicios.repository';
import { EjerciciosServiceImpl } from './services/ejercicios.service';

@Module({
  imports: [PrismaModule],
  controllers: [EjerciciosController],
  providers: [
    EjerciciosRepository,
    EjerciciosServiceImpl,
    {
      provide: 'EJERCICIOS_SERVICE',
      useFactory: (impl: EjerciciosServiceImpl) => new CacheEjerciciosDecorator(impl),
      inject: [EjerciciosServiceImpl],
    },
  ],
  exports: [EjerciciosRepository],
})
export class EjerciciosModule {}
