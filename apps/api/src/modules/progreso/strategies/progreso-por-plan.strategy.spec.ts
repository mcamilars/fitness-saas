import { GrupoMuscular } from '@repo/database';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type { ProgresoStrategyContexto } from './progreso-strategy.interface';
import { ProgresoPorPlanStrategy } from './progreso-por-plan.strategy';

const ejercicio = {
  id: 'ej-1',
  registroDeEntrenamientoId: 'r1',
  nombre: 'Dominadas',
  grupoMuscular: GrupoMuscular.ESPALDA,
  series: 4,
  repeticiones: 8,
  pesoKg: null,
  notas: null,
};

function makeRegistro(id: string, fecha: string): RegistroConEjercicios {
  return {
    id,
    clienteId: 'cliente-1',
    fecha: new Date(fecha),
    notas: null,
    duracionMin: 45,
    creadoEn: new Date(),
    ejercicios: [{ ...ejercicio, registroDeEntrenamientoId: id }],
  };
}

describe('ProgresoPorPlanStrategy', () => {
  let strategy: ProgresoPorPlanStrategy;

  const contextoConDosPlanes: ProgresoStrategyContexto = {
    asignaciones: [
      {
        planDeEntrenamientoId: 'plan-1',
        etiqueta: 'Plan Fuerza',
        asignadoEn: new Date('2026-04-01'),
      },
      {
        planDeEntrenamientoId: 'plan-2',
        etiqueta: 'Plan Hipertrofia',
        asignadoEn: new Date('2026-05-01'),
      },
    ],
  };

  beforeEach(() => {
    strategy = new ProgresoPorPlanStrategy();
  });

  it('asigna registros anteriores al primer plan a ese plan', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-04-15'),
    ];

    const resultado = strategy.calcular(registros, contextoConDosPlanes);

    expect(resultado.periodos).toHaveLength(1);
    expect(resultado.periodos[0].etiqueta).toBe('Plan Fuerza');
    expect(resultado.periodos[0].totalSesiones).toBe(1);
  });

  it('asigna registros posteriores al cambio de plan al nuevo plan', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-05-15'),
    ];

    const resultado = strategy.calcular(registros, contextoConDosPlanes);

    expect(resultado.periodos[0].etiqueta).toBe('Plan Hipertrofia');
  });

  it('agrupa correctamente registros de dos planes distintos', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-04-10'),
      makeRegistro('r2', '2026-04-20'),
      makeRegistro('r3', '2026-05-10'),
    ];

    const resultado = strategy.calcular(registros, contextoConDosPlanes);

    expect(resultado.periodos).toHaveLength(2);
    const fuerza = resultado.periodos.find((p) => p.etiqueta === 'Plan Fuerza')!;
    const hiper = resultado.periodos.find((p) => p.etiqueta === 'Plan Hipertrofia')!;
    expect(fuerza.totalSesiones).toBe(2);
    expect(hiper.totalSesiones).toBe(1);
  });

  it('agrupa bajo "Sin plan asignado" cuando no hay contexto', () => {
    const registros: RegistroConEjercicios[] = [makeRegistro('r1', '2026-05-01')];

    const resultado = strategy.calcular(registros);

    expect(resultado.periodos[0].etiqueta).toBe('Sin plan asignado');
  });

  it('agrupa bajo "Sin plan asignado" cuando el registro es anterior a toda asignacion', () => {
    const contexto: ProgresoStrategyContexto = {
      asignaciones: [
        {
          planDeEntrenamientoId: 'plan-1',
          etiqueta: 'Plan A',
          asignadoEn: new Date('2026-06-01'),
        },
      ],
    };

    const registros: RegistroConEjercicios[] = [makeRegistro('r1', '2026-05-01')];

    const resultado = strategy.calcular(registros, contexto);

    expect(resultado.periodos[0].etiqueta).toBe('Sin plan asignado');
  });

  it('totalSesiones refleja el total global de registros', () => {
    const registros: RegistroConEjercicios[] = [
      makeRegistro('r1', '2026-04-10'),
      makeRegistro('r2', '2026-05-10'),
    ];

    const resultado = strategy.calcular(registros, contextoConDosPlanes);

    expect(resultado.totalSesiones).toBe(2);
  });
});
