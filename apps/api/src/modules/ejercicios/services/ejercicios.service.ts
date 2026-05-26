import { Injectable } from '@nestjs/common';
import type { Ejercicio } from '@repo/database';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import type { EjerciciosServiceInterface } from '../interfaces/ejercicios-service.interface';
import { EjerciciosRepository } from '../repositories/ejercicios.repository';

@Injectable()
export class EjerciciosServiceImpl implements EjerciciosServiceInterface {
  constructor(private readonly ejerciciosRepository: EjerciciosRepository) {}

  findAll(): Promise<Ejercicio[]> {
    return this.ejerciciosRepository.findAll();
  }

  findById(id: string): Promise<Ejercicio | null> {
    return this.ejerciciosRepository.findById(id);
  }

  findByGrupo(grupo: Ejercicio['grupoMuscular']): Promise<Ejercicio[]> {
    return this.ejerciciosRepository.findByGrupo(grupo);
  }

  create(dto: CrearEjercicioDto): Promise<Ejercicio> {
    return this.ejerciciosRepository.crear({
      nombre: dto.nombre,
      grupoMuscular: dto.grupoMuscular,
      descripcion: dto.descripcion ?? null,
      instrucciones: dto.instrucciones ?? null,
      imagenUrl: dto.imagenUrl ?? null,
      videoUrl: dto.videoUrl ?? null,
    });
  }
}
