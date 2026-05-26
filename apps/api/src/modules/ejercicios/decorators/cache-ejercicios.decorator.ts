import type { Ejercicio, GrupoMuscular } from '@repo/database';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import { BaseDecorator } from './base.decorator';

export class CacheEjerciciosDecorator extends BaseDecorator {
  private readonly cache = new Map<string, Ejercicio | Ejercicio[]>();

  async findAll(): Promise<Ejercicio[]> {
    const key = 'all';
    const cached = this.cache.get(key) as Ejercicio[] | undefined;
    if (cached !== undefined) {
      return cached;
    }

    const result = await super.findAll();
    this.cache.set(key, result);
    return result;
  }

  async findById(id: string): Promise<Ejercicio | null> {
    const key = `id:${id}`;
    const cached = this.cache.get(key) as Ejercicio | undefined;
    if (cached !== undefined) {
      return cached;
    }

    const result = await super.findById(id);
    if (result !== null) {
      this.cache.set(key, result);
    }
    return result;
  }

  async findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]> {
    const key = `grupo:${grupo}`;
    const cached = this.cache.get(key) as Ejercicio[] | undefined;
    if (cached !== undefined) {
      return cached;
    }

    const result = await super.findByGrupo(grupo);
    this.cache.set(key, result);
    return result;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  flush(): void {
    this.cache.clear();
  }

  async create(dto: CrearEjercicioDto): Promise<Ejercicio> {
    const result = await super.create(dto);
    this.flush();
    return result;
  }
}
