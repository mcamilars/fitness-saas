import { Injectable } from '@nestjs/common';
import {
  EstadoAsignacion,
  type AsignacionPlanEntrenamiento,
  Prisma,
  PrismaService,
} from '@repo/database';

export type AsignacionPlanEntrenamientoConPlan = Prisma.AsignacionPlanEntrenamientoGetPayload<{
  include: { planDeEntrenamiento: { select: { id: true; nombre: true } } };
}>;

export interface CrearAsignacionEntrenamientoInput {
  clienteId: string;
  planDeEntrenamientoId: string;
  estado?: EstadoAsignacion;
}

export interface AsignacionesEntrenamientoRepositoryInterface {
  crear(
    dto: CrearAsignacionEntrenamientoInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AsignacionPlanEntrenamiento>;
  findById(id: string): Promise<AsignacionPlanEntrenamiento | null>;
  findPorCliente(clienteId: string): Promise<AsignacionPlanEntrenamientoConPlan[]>;
  findPorPlan(planId: string): Promise<AsignacionPlanEntrenamiento[]>;
  updateEstado(
    id: string,
    estado: EstadoAsignacion,
    tx?: Prisma.TransactionClient,
  ): Promise<AsignacionPlanEntrenamiento>;
  findActivaPorCliente(
    clienteId: string,
  ): Promise<AsignacionPlanEntrenamiento | null>;
  findActivaPorClienteYPlan(
    clienteId: string,
    planDeEntrenamientoId: string,
  ): Promise<AsignacionPlanEntrenamiento | null>;
}

@Injectable()
export class AsignacionesEntrenamientoRepository
  implements AsignacionesEntrenamientoRepositoryInterface
{
  constructor(private readonly prisma: PrismaService) {}

  crear(
    dto: CrearAsignacionEntrenamientoInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AsignacionPlanEntrenamiento> {
    const client = tx ?? this.prisma;

    return client.asignacionPlanEntrenamiento.create({
      data: {
        clienteId: dto.clienteId,
        planDeEntrenamientoId: dto.planDeEntrenamientoId,
        estado: dto.estado ?? EstadoAsignacion.ACTIVO,
      },
    });
  }

  findById(id: string): Promise<AsignacionPlanEntrenamiento | null> {
    return this.prisma.asignacionPlanEntrenamiento.findUnique({
      where: { id },
    });
  }

  findPorCliente(clienteId: string): Promise<AsignacionPlanEntrenamientoConPlan[]> {
    return this.prisma.asignacionPlanEntrenamiento.findMany({
      where: { clienteId },
      include: { planDeEntrenamiento: { select: { id: true, nombre: true } } },
      orderBy: { asignadoEn: 'desc' },
    });
  }

  findPorPlan(planId: string): Promise<AsignacionPlanEntrenamiento[]> {
    return this.prisma.asignacionPlanEntrenamiento.findMany({
      where: { planDeEntrenamientoId: planId },
      orderBy: { asignadoEn: 'desc' },
    });
  }

  updateEstado(
    id: string,
    estado: EstadoAsignacion,
    tx?: Prisma.TransactionClient,
  ): Promise<AsignacionPlanEntrenamiento> {
    const client = tx ?? this.prisma;

    return client.asignacionPlanEntrenamiento.update({
      where: { id },
      data: { estado },
    });
  }

  findActivaPorCliente(
    clienteId: string,
  ): Promise<AsignacionPlanEntrenamiento | null> {
    return this.prisma.asignacionPlanEntrenamiento.findFirst({
      where: { clienteId, estado: EstadoAsignacion.ACTIVO },
      orderBy: { asignadoEn: 'desc' },
    });
  }

  findActivaPorClienteYPlan(
    clienteId: string,
    planDeEntrenamientoId: string,
  ): Promise<AsignacionPlanEntrenamiento | null> {
    return this.prisma.asignacionPlanEntrenamiento.findFirst({
      where: {
        clienteId,
        planDeEntrenamientoId,
        estado: EstadoAsignacion.ACTIVO,
      },
      orderBy: { asignadoEn: 'desc' },
    });
  }
}
