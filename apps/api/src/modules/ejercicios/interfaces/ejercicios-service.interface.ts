import type { Ejercicio, GrupoMuscular } from '@repo/database';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';

export interface EjerciciosServiceInterface {
  findAll(): Promise<Ejercicio[]>;
  findById(id: string): Promise<Ejercicio | null>;
  findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]>;
  create(dto: CrearEjercicioDto): Promise<Ejercicio>;
}
