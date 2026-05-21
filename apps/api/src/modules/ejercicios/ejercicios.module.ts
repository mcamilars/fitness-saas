import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { EjerciciosRepository } from './repositories/ejercicios.repository';

@Module({
  imports: [PrismaModule],
  providers: [EjerciciosRepository],
  exports: [EjerciciosRepository],
})
export class EjerciciosModule {}
