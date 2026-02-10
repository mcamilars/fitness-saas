/**
 * @repo/database - Shared Prisma package
 *
 * Este paquete proporciona acceso centralizado a Prisma para todo el monorepo.
 * Exporta el PrismaService y PrismaModule para usar con NestJS.
 */

// ── Exportaciones principales ──
export { PrismaService } from './prisma.service';
export { PrismaModule } from './prisma.module';

// ── Re-exportar todo de @prisma/client ──
// Esto permite importar tipos y utilidades directamente desde @repo/database:
// import { User, Prisma } from '@repo/database'
export * from '@prisma/client';
