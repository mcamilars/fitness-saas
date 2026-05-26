import { Injectable } from '@nestjs/common';
import { type Cliente, Prisma, PrismaService } from '@repo/database';

// Campos públicos del usuario: excluye explícitamente `contrasenaHash`
// para que el perfil del cliente nunca exponga el hash de la contraseña.
const usuarioPublicoSelect = {
  id: true,
  correo: true,
  nombre: true,
  apellido: true,
  rol: true,
  estaActivo: true,
  creadoEn: true,
  actualizadoEn: true,
} satisfies Prisma.UsuarioSelect;

export type ClienteConPerfil = Prisma.ClienteGetPayload<{
  include: { usuario: { select: typeof usuarioPublicoSelect } };
}>;

export type ActualizarClienteDto = Prisma.ClienteUpdateInput;

export interface ClientesRepositoryInterface {
  findByUsuarioId(usuarioId: string): Promise<Cliente | null>;
  findAllPorWorkspace(workspaceId: string): Promise<ClienteConPerfil[]>;
  findByIdConPerfil(
    id: string,
    workspaceId?: string,
  ): Promise<ClienteConPerfil | null>;
  crear(
    data: Prisma.ClienteCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Cliente>;
  update(
    id: string,
    dto: ActualizarClienteDto,
    workspaceId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteConPerfil | null>;
  setActivo(
    id: string,
    valor: boolean,
    workspaceId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteConPerfil | null>;
}

@Injectable()
export class ClientesRepository implements ClientesRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  findByUsuarioId(usuarioId: string): Promise<Cliente | null> {
    return this.prisma.cliente.findUnique({ where: { usuarioId } });
  }

  findAllPorWorkspace(workspaceId: string): Promise<ClienteConPerfil[]> {
    return this.prisma.cliente.findMany({
      where: { espacioDeTrabajoId: workspaceId },
      include: { usuario: { select: usuarioPublicoSelect } },
      orderBy: { creadoEn: 'desc' },
    });
  }

  findByIdConPerfil(
    id: string,
    workspaceId?: string,
  ): Promise<ClienteConPerfil | null> {
    return this.prisma.cliente.findFirst({
      where: { id, ...(workspaceId ? { espacioDeTrabajoId: workspaceId } : {}) },
      include: { usuario: { select: usuarioPublicoSelect } },
    });
  }

  crear(
    data: Prisma.ClienteCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Cliente> {
    const client = tx ?? this.prisma;
    return client.cliente.create({ data });
  }

  async update(
    id: string,
    dto: ActualizarClienteDto,
    workspaceId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteConPerfil | null> {
    const client = tx ?? this.prisma;

    await client.cliente.updateMany({
      where: { id, ...(workspaceId ? { espacioDeTrabajoId: workspaceId } : {}) },
      data: dto,
    });

    return client.cliente.findFirst({
      where: { id, ...(workspaceId ? { espacioDeTrabajoId: workspaceId } : {}) },
      include: { usuario: { select: usuarioPublicoSelect } },
    });
  }

  setActivo(
    id: string,
    valor: boolean,
    workspaceId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ClienteConPerfil | null> {
    return this.update(id, { estaActivo: valor }, workspaceId, tx);
  }
}
