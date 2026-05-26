import { PrismaService } from '@repo/database';

export async function truncateAll(prisma: PrismaService): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      notificaciones,
      registros_de_ejercicios,
      registros_de_entrenamiento,
      asignaciones_de_planes_de_entrenamiento,
      ejercicios_planes,
      planes_de_entrenamiento,
      invitaciones,
      ejercicios,
      clientes,
      entrenadores,
      espacios_de_trabajo,
      usuarios
    CASCADE
  `;
}
