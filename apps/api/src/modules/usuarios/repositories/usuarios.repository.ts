import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, type Usuario } from '@repo/database';

export interface UsuariosRepositoryInterface {
  findByCorreo(correo: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  crear(data: Prisma.UsuarioCreateInput, tx?: Prisma.TransactionClient): Promise<Usuario>;
}

@Injectable()
export class UsuariosRepository implements UsuariosRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  findByCorreo(correo: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { correo } });
  }

  findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  crear(data: Prisma.UsuarioCreateInput, tx?: Prisma.TransactionClient): Promise<Usuario> {
    const client = tx ?? this.prisma;
    return client.usuario.create({ data });
  }
}
