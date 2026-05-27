import { GrupoMuscular } from '@repo/database';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import { ProgresoSemanalStrategy } from './progreso-semanal.strategy';

const ejercicio = {
  id: 'ej-1',
  registroDeEntrenamientoId: 'r1',
  nombre: 'Press banca',
  grupoMuscular: GrupoMuscular.PECHO,
  series: 4,
  repeticiones: 10,
  pesoKg: 80,
  notas: null,
};

function makeRegistro(
  id: string,
  fecha: string,
  ejercicios = [ejercicio],
  duracionMin?: number,
): RegistroConEjercicios {
  return {
    id,
    clienteId: 'cliente-1',
    fecha: new Date(fecha),
    notas: null,
    duracionMin: duracionMin ?? null,
    creadoEn: new Date(),
    ejercicios: ejercicios.map((e) => ({ ...e, registroDeEntrenamientoId: id })),
  };
}

describe('ProgresoSemanalStrategy', () => {
  let strategy: ProgresoSemanalStrategy;

  beforeEach(() => {
    strategy = new ProgresoSemanalStrategy();
  });

  it('agrupa registros de la misma semana bajo una sola etiqueta amigable', () => {
    // 2026-05-25 (lunes) y 2026-05-26 (martes) → 25 may - 31 may
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-25'),
      makeRegistro('r2', '2026-05-26'),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos).toHaveLength(1);
    expect(resultado.periodos[0].etiqueta).toBe('25 may - 31 may');
    expect(resultado.periodos[0].totalSesiones).toBe(2);
  });

  it('separa registros de semanas distintas en periodos distintos', () => {
    // 2026-05-18 (lunes) → 18 may - 24 may — 2026-05-25 (lunes) → 25 may - 31 may
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-18'),
      makeRegistro('r2', '2026-05-25'),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos).toHaveLength(2);
    expect(resultado.periodos[0].etiqueta).toBe('18 may - 24 may');
    expect(resultado.periodos[1].etiqueta).toBe('25 may - 31 may');
  });

  it('acumula totalEjercicios y duracionTotalMin correctamente', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-25', [ejercicio, ejercicio], 45),
      makeRegistro('r2', '2026-05-26', [ejercicio], 30),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos[0].totalEjercicios).toBe(3);
    expect(resultado.periodos[0].duracionTotalMin).toBe(75);
  });

  it('totalSesiones refleja el total global de registros', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-25'),
      makeRegistro('r2', '2026-05-18'),
      makeRegistro('r3', '2026-05-11'),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.totalSesiones).toBe(3);
    expect(resultado.periodos).toHaveLength(3);
  });

  it('devuelve periodos ordenados por etiqueta ascendente', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-25'),
      makeRegistro('r2', '2026-05-11'),
      makeRegistro('r3', '2026-05-18'),
    ];

    const resultado = strategy.calcular(registros);
    const etiquetas = resultado.periodos.map((p) => p.etiqueta);

    expect(etiquetas).toEqual(['11 may - 17 may', '18 may - 24 may', '25 may - 31 may']);
  });

  it('retorna lista vacía de periodos si no hay registros', () => {
    const resultado = strategy.calcular([]);

    expect(resultado.periodos).toHaveLength(0);
    expect(resultado.totalSesiones).toBe(0);
  });
});
