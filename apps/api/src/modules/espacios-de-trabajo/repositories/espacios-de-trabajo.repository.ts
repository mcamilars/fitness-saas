import { Injectable } from '@nestjs/common';
import { type EspacioDeTrabajo, Prisma, PrismaService } from '@repo/database';

export interface EspaciosDeTrabajoRepositoryInterface {
  findById(id: string): Promise<EspacioDeTrabajo | null>;
  findBySlug(slug: string): Promise<EspacioDeTrabajo | null>;
  crear(
    data: Prisma.EspacioDeTrabajoCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EspacioDeTrabajo>;
}

@Injectable()
export class EspaciosDeTrabajoRepository
  implements EspaciosDeTrabajoRepositoryInterface
{
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<EspacioDeTrabajo | null> {
    return this.prisma.espacioDeTrabajo.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<EspacioDeTrabajo | null> {
    return this.prisma.espacioDeTrabajo.findUnique({ where: { slug } });
  }

  crear(
    data: Prisma.EspacioDeTrabajoCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EspacioDeTrabajo> {
    const client = tx ?? this.prisma;
    return client.espacioDeTrabajo.create({ data });
  }
}
