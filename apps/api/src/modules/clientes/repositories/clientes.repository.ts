import { Injectable } from '@nestjs/common';
import { type Cliente, Prisma, PrismaService } from '@repo/database';

export interface ClientesRepositoryInterface {
  findByUsuarioId(usuarioId: string): Promise<Cliente | null>;
  crear(
    data: Prisma.ClienteCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Cliente>;
}

@Injectable()
export class ClientesRepository implements ClientesRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  findByUsuarioId(usuarioId: string): Promise<Cliente | null> {
    return this.prisma.cliente.findUnique({ where: { usuarioId } });
  }

  crear(
    data: Prisma.ClienteCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Cliente> {
    const client = tx ?? this.prisma;
    return client.cliente.create({ data });
  }
}
