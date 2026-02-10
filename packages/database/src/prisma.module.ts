import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo global de Prisma para NestJS
 *
 * @Global() hace que PrismaService esté disponible en toda la app
 * sin necesidad de importar este módulo en cada feature module.
 *
 * Solo necesitas importar PrismaModule una vez en tu AppModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
