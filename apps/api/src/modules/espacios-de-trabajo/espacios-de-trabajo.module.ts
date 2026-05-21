import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { EspaciosDeTrabajoRepository } from './repositories/espacios-de-trabajo.repository';

@Module({
  imports: [PrismaModule],
  providers: [EspaciosDeTrabajoRepository],
  exports: [EspaciosDeTrabajoRepository],
})
export class EspaciosDeTrabajoModule {}
