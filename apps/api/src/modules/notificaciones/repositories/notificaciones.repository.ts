import { Injectable } from '@nestjs/common';
import { type Notificacion, Prisma, PrismaService } from '@repo/database';

export interface CrearNotificacionInput {
  clienteId: string;
  mensaje: string;
}

export interface NotificacionesRepositoryInterface {
  crear(
    dto: CrearNotificacionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Notificacion>;
  findNoLeidasPorCliente(clienteId: string): Promise<Notificacion[]>;
  marcarLeida(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Notificacion>;
}

@Injectable()
export class NotificacionesRepository
  implements NotificacionesRepositoryInterface
{
  constructor(private readonly prisma: PrismaService) {}

  crear(
    dto: CrearNotificacionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Notificacion> {
    const client = tx ?? this.prisma;

    return client.notificacion.create({
      data: dto,
    });
  }

  findNoLeidasPorCliente(clienteId: string): Promise<Notificacion[]> {
    return this.prisma.notificacion.findMany({
      where: { clienteId, leida: false },
      orderBy: { creadoEn: 'desc' },
    });
  }

  marcarLeida(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Notificacion> {
    const client = tx ?? this.prisma;

    return client.notificacion.update({
      where: { id },
      data: { leida: true },
    });
  }
}
