import { BadRequestException } from '@nestjs/common';
import type { GrupoMuscular } from '@repo/database';

export interface RegistroDeEjercicioDraft {
  ejercicioId?: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  series: number;
  repeticiones: number;
  pesoKg?: number;
  notas?: string;
}

export interface RegistroEntrenamientoDraft {
  fecha: Date;
  clienteId: string;
  planDeEntrenamientoId?: string;
  ejercicios: RegistroDeEjercicioDraft[];
  notas?: string;
  duracionMin?: number;
}

export class RegistroEntrenamientoBuilder {
  private fecha?: Date;
  private clienteId?: string;
  private planDeEntrenamientoId?: string;
  private readonly ejercicios: RegistroDeEjercicioDraft[] = [];
  private notas?: string;
  private duracionMin?: number;

  setFecha(fecha: Date): this {
    this.fecha = new Date(fecha);
    return this;
  }

  setClienteId(clienteId: string): this {
    this.clienteId = clienteId;
    return this;
  }

  setPlanDeEntrenamientoId(planDeEntrenamientoId: string): this {
    this.planDeEntrenamientoId = planDeEntrenamientoId;
    return this;
  }

  addEjercicio(ejercicio: RegistroDeEjercicioDraft): this {
    this.ejercicios.push({ ...ejercicio });
    return this;
  }

  setNotas(notas: string): this {
    this.notas = notas;
    return this;
  }

  setDuracionMin(duracionMin: number): this {
    this.duracionMin = duracionMin;
    return this;
  }

  build(): Readonly<RegistroEntrenamientoDraft> {
    if (!this.fecha) {
      throw new BadRequestException('La fecha del registro es obligatoria');
    }

    if (!this.clienteId) {
      throw new BadRequestException('El cliente del registro es obligatorio');
    }

    if (this.ejercicios.length < 1) {
      throw new BadRequestException('El registro debe tener al menos un ejercicio');
    }

    return Object.freeze({
      fecha: new Date(this.fecha),
      clienteId: this.clienteId,
      planDeEntrenamientoId: this.planDeEntrenamientoId,
      ejercicios: this.ejercicios.map((ejercicio) => ({ ...ejercicio })),
      notas: this.notas,
      duracionMin: this.duracionMin,
    });
  }
}
