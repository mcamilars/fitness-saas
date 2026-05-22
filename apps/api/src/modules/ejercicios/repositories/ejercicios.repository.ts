import { Injectable } from '@nestjs/common';
import { type Ejercicio, PrismaService } from '@repo/database';

@Injectable()
export class EjerciciosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Ejercicio[]> {
    return this.prisma.ejercicio.findMany({
      orderBy: { nombre: 'asc' },
    });
  }
}
