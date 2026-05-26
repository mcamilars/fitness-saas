import { Injectable } from '@nestjs/common';
import { type Invitacion, Prisma, PrismaService } from '@repo/database';

export interface CrearInvitacionDto {
  espacioDeTrabajoId: string;
  correo: string;
  token: string;
  expiraEn: Date;
}

export interface InvitacionesRepositoryInterface {
  findByToken(token: string): Promise<Invitacion | null>;
  crear(dto: CrearInvitacionDto, tx?: Prisma.TransactionClient): Promise<Invitacion>;
  marcarConsumida(token: string, tx?: Prisma.TransactionClient): Promise<Invitacion>;
  marcarConsumidaPorId(id: string, tx?: Prisma.TransactionClient): Promise<Invitacion>;
}

@Injectable()
export class InvitacionesRepository implements InvitacionesRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  findByToken(token: string): Promise<Invitacion | null> {
    return this.prisma.invitacion.findUnique({ where: { token } });
  }

  crear(
    dto: CrearInvitacionDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Invitacion> {
    const client = tx ?? this.prisma;
    return client.invitacion.create({ data: dto });
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

  marcarConsumidaPorId(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Invitacion> {
    const client = tx ?? this.prisma;
    return client.invitacion.update({
      where: { id },
      data: { consumida: true },
    });
  }
}
