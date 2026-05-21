import { Injectable } from '@nestjs/common';
import { type Entrenador, Prisma, PrismaService } from '@repo/database';

export interface EntrenadoresRepositoryInterface {
  findByUsuarioId(usuarioId: string): Promise<Entrenador | null>;
  findByEspacioDeTrabajoId(espacioDeTrabajoId: string): Promise<Entrenador | null>;
  crear(
    data: Prisma.EntrenadorCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Entrenador>;
}

@Injectable()
export class EntrenadoresRepository implements EntrenadoresRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  findByUsuarioId(usuarioId: string): Promise<Entrenador | null> {
    return this.prisma.entrenador.findUnique({ where: { usuarioId } });
  }

  findByEspacioDeTrabajoId(espacioDeTrabajoId: string): Promise<Entrenador | null> {
    return this.prisma.entrenador.findUnique({ where: { espacioDeTrabajoId } });
  }

  crear(
    data: Prisma.EntrenadorCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Entrenador> {
    const client = tx ?? this.prisma;
    return client.entrenador.create({ data });
  }
}
