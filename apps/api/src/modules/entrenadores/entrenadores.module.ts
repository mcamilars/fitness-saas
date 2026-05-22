import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';
import { EntrenadoresRepository } from './repositories/entrenadores.repository';

@Module({
  imports: [PrismaModule],
  providers: [EntrenadoresRepository],
  exports: [EntrenadoresRepository],
})
export class EntrenadoresModule {}
