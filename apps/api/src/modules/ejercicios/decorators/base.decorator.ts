import type { Ejercicio, GrupoMuscular } from '@repo/database';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import type { EjerciciosServiceInterface } from '../interfaces/ejercicios-service.interface';

export abstract class BaseDecorator implements EjerciciosServiceInterface {
  constructor(protected readonly service: EjerciciosServiceInterface) {}

  findAll(): Promise<Ejercicio[]> {
    return this.service.findAll();
  }

  findById(id: string): Promise<Ejercicio | null> {
    return this.service.findById(id);
  }

  findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]> {
    return this.service.findByGrupo(grupo);
  }

  create(dto: CrearEjercicioDto): Promise<Ejercicio> {
    return this.service.create(dto);
  }
}
