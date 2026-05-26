import { Injectable } from '@nestjs/common';
import { type Ejercicio, GrupoMuscular, Prisma, PrismaService } from '@repo/database';

@Injectable()
export class EjerciciosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Ejercicio[]> {
    return this.prisma.ejercicio.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  findById(id: string): Promise<Ejercicio | null> {
    return this.prisma.ejercicio.findUnique({ where: { id } });
  }

  findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]> {
    return this.prisma.ejercicio.findMany({
      where: { grupoMuscular: grupo },
      orderBy: { nombre: 'asc' },
    });
  }

  crear(data: Prisma.EjercicioCreateInput): Promise<Ejercicio> {
    return this.prisma.ejercicio.create({ data });
  }
}
