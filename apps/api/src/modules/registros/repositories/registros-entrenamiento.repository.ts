import { Injectable } from '@nestjs/common';
import {
  type RegistroDeEntrenamiento,
  type RegistroDeEjercicio,
  Prisma,
  PrismaService,
} from '@repo/database';
import type { RegistroEntrenamientoDraft } from '../builders/registro-entrenamiento.builder';

export type RegistroConEjercicios = RegistroDeEntrenamiento & {
  ejercicios: RegistroDeEjercicio[];
};

export interface FiltrosListarRegistros {
  page?: number;
  limit?: number;
  desde?: Date;
  hasta?: Date;
}

export interface ListadoRegistrosResult {
  registros: RegistroConEjercicios[];
  total: number;
  page: number;
  limit: number;
}

export interface RegistrosEntrenamientoRepositoryInterface {
  crearConEjercicios(
    payload: Readonly<RegistroEntrenamientoDraft>,
    tx?: Prisma.TransactionClient,
  ): Promise<RegistroConEjercicios>;
  listarPorCliente(
    clienteId: string,
    filtros: FiltrosListarRegistros,
  ): Promise<ListadoRegistrosResult>;
  findPorClienteConDetalle(
    clienteId: string,
  ): Promise<RegistroConEjercicios[]>;
}

@Injectable()
export class RegistrosEntrenamientoRepository
  implements RegistrosEntrenamientoRepositoryInterface
{
  constructor(private readonly prisma: PrismaService) {}

  async crearConEjercicios(
    payload: Readonly<RegistroEntrenamientoDraft>,
    tx?: Prisma.TransactionClient,
  ): Promise<RegistroConEjercicios> {
    const client = tx ?? this.prisma;

    return client.registroDeEntrenamiento.create({
      data: {
        clienteId: payload.clienteId,
        planDeEntrenamientoId: payload.planDeEntrenamientoId,
        fecha: payload.fecha,
        notas: payload.notas,
        duracionMin: payload.duracionMin,
        ejercicios: {
          create: payload.ejercicios.map((e) => ({
            nombre: e.nombre,
            grupoMuscular: e.grupoMuscular,
            series: e.series,
            repeticiones: e.repeticiones,
            pesoKg: e.pesoKg,
            notas: e.notas,
          })),
        },
      },
      include: { ejercicios: true },
    });
  }

  async listarPorCliente(
    clienteId: string,
    filtros: FiltrosListarRegistros,
  ): Promise<ListadoRegistrosResult> {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RegistroDeEntrenamientoWhereInput = {
      clienteId,
      ...(filtros.desde || filtros.hasta
        ? {
            fecha: {
              ...(filtros.desde ? { gte: filtros.desde } : {}),
              ...(filtros.hasta ? { lte: filtros.hasta } : {}),
            },
          }
        : {}),
    };

    const [registros, total] = await Promise.all([
      this.prisma.registroDeEntrenamiento.findMany({
        where,
        include: { ejercicios: true },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.registroDeEntrenamiento.count({ where }),
    ]);

    return { registros, total, page, limit };
  }

  findPorClienteConDetalle(clienteId: string): Promise<RegistroConEjercicios[]> {
    return this.prisma.registroDeEntrenamiento.findMany({
      where: { clienteId },
      include: { ejercicios: true },
      orderBy: { fecha: 'desc' },
    });
  }
}
