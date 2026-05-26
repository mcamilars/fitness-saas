import { GrupoMuscular } from '@repo/database';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import { ProgresoMensualStrategy } from './progreso-mensual.strategy';

const ejercicio = {
  id: 'ej-1',
  registroDeEntrenamientoId: 'r1',
  nombre: 'Sentadilla',
  grupoMuscular: GrupoMuscular.PIERNAS,
  series: 3,
  repeticiones: 12,
  pesoKg: 100,
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

describe('ProgresoMensualStrategy', () => {
  let strategy: ProgresoMensualStrategy;

  beforeEach(() => {
    strategy = new ProgresoMensualStrategy();
  });

  it('agrupa registros del mismo mes bajo una sola etiqueta', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-10'),
      makeRegistro('r2', '2026-05-25'),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos).toHaveLength(1);
    expect(resultado.periodos[0].etiqueta).toBe('2026-05');
    expect(resultado.periodos[0].totalSesiones).toBe(2);
  });

  it('separa registros de meses distintos en periodos distintos', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-04-30'),
      makeRegistro('r2', '2026-05-01'),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos).toHaveLength(2);
    expect(resultado.periodos[0].etiqueta).toBe('2026-04');
    expect(resultado.periodos[1].etiqueta).toBe('2026-05');
  });

  it('formatea el mes con cero a la izquierda para meses del 1 al 9', () => {
    const registros: RegistroConEjercicios[] = [makeRegistro('r1', '2026-03-15')];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos[0].etiqueta).toBe('2026-03');
  });

  it('acumula totalEjercicios y duracionTotalMin correctamente en el mismo mes', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-10', [ejercicio, ejercicio], 60),
      makeRegistro('r2', '2026-05-20', [ejercicio], 45),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos[0].totalEjercicios).toBe(3);
    expect(resultado.periodos[0].duracionTotalMin).toBe(105);
  });

  it('totalSesiones refleja el total global de registros', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-01'),
      makeRegistro('r2', '2026-04-01'),
    ];

    const resultado = strategy.calcular(registros);

    expect(resultado.totalSesiones).toBe(2);
  });

  it('devuelve periodos ordenados por etiqueta ascendente', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-01'),
      makeRegistro('r2', '2026-03-01'),
      makeRegistro('r3', '2026-04-01'),
    ];

    const resultado = strategy.calcular(registros);
    const etiquetas = resultado.periodos.map((p) => p.etiqueta);

    expect(etiquetas).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('retorna lista vacía de periodos si no hay registros', () => {
    const resultado = strategy.calcular([]);

    expect(resultado.periodos).toHaveLength(0);
    expect(resultado.totalSesiones).toBe(0);
  });
});
