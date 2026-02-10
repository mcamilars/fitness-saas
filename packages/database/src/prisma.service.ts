import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service para NestJS
 *
 * Este servicio extiende PrismaClient y maneja automáticamente:
 * - Conexión a la base de datos al iniciar el módulo
 * - Desconexión al destruir el módulo
 * - Logging integrado con NestJS
 *
 * Configuración del cliente:
 * - En desarrollo: logs de query, error y warn
 * - En producción: solo logs de error
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma connected to database successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('🔌 Prisma disconnected from database');
    } catch (error) {
      this.logger.error('⚠️  Error disconnecting from database', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
