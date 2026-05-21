import { type Ejercicio, type GrupoMuscular } from '@repo/database';

export interface EjerciciosCatalogSource {
  findAll(): Promise<Ejercicio[]>;
}

export class EjerciciosCatalog {
  private static instance: EjerciciosCatalog | null = null;

  private readonly ejercicios = new Map<string, Ejercicio>();

  private constructor() {
    // Impide instancias externas; usar EjerciciosCatalog.getInstance().
  }

  static getInstance(): EjerciciosCatalog {
    EjerciciosCatalog.instance ??= new EjerciciosCatalog();
    return EjerciciosCatalog.instance;
  }

  async cargarDesde(ejerciciosRepository: EjerciciosCatalogSource): Promise<void> {
    const ejercicios = await ejerciciosRepository.findAll();

    this.ejercicios.clear();
    for (const ejercicio of ejercicios) {
      this.ejercicios.set(ejercicio.id, { ...ejercicio });
    }
  }

  buscarPorGrupo(grupo: GrupoMuscular): Ejercicio[] {
    return Array.from(this.ejercicios.values())
      .filter((ejercicio) => ejercicio.grupoMuscular === grupo)
      .map((ejercicio) => ({ ...ejercicio }));
  }

  obtenerTodos(): Ejercicio[] {
    return Array.from(this.ejercicios.values(), (ejercicio) => ({
      ...ejercicio,
    }));
  }
}
