import { Injectable } from '@nestjs/common';
import { type Invitacion, Prisma, PrismaService } from '@repo/database';

export interface InvitacionesRepositoryInterface {
  findByToken(token: string): Promise<Invitacion | null>;
  marcarConsumida(token: string, tx?: Prisma.TransactionClient): Promise<Invitacion>;
}

@Injectable()
export class InvitacionesRepository implements InvitacionesRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  findByToken(token: string): Promise<Invitacion | null> {
    return this.prisma.invitacion.findUnique({ where: { token } });
  }

  marcarConsumida(
    token: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Invitacion> {
    const client = tx ?? this.prisma;
    return client.invitacion.update({
      where: { token },
      data: { consumida: true },
    });
  }
}
