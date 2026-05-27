import { GrupoMuscular } from '@repo/database';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import { ProgresoMensualStrategy } from '../strategies/progreso-mensual.strategy';
import { ProgresoPorPlanStrategy } from '../strategies/progreso-por-plan.strategy';
import { ProgresoSemanalStrategy } from '../strategies/progreso-semanal.strategy';
import { ProgresoService } from './progreso.service';

const registroBase: RegistroConEjercicios = {
  id: 'r1',
  clienteId: 'cliente-1',
  fecha: new Date('2026-05-25'),
  notas: null,
  duracionMin: 60,
  creadoEn: new Date(),
  ejercicios: [
    {
      id: 'ej-1',
      registroDeEntrenamientoId: 'r1',
      nombre: 'Press banca',
      grupoMuscular: GrupoMuscular.PECHO,
      series: 4,
      repeticiones: 10,
      pesoKg: 80,
      notas: null,
    },
  ],
};

describe('ProgresoService', () => {
  const registrosRepository = {
    findPorClienteConDetalle: jest.fn(),
  };

  const asignacionesRepository = {
    findPorCliente: jest.fn(),
  };

  const semanalStrategy = new ProgresoSemanalStrategy();
  const mensualStrategy = new ProgresoMensualStrategy();
  const porPlanStrategy = new ProgresoPorPlanStrategy();

  let service: ProgresoService;

  beforeEach(() => {
    jest.clearAllMocks();
    registrosRepository.findPorClienteConDetalle.mockResolvedValue([registroBase]);
    asignacionesRepository.findPorCliente.mockResolvedValue([]);
    service = new ProgresoService(
      registrosRepository as never,
      asignacionesRepository as never,
      semanalStrategy,
      mensualStrategy,
      porPlanStrategy,
    );
  });

  it('usa ProgresoSemanalStrategy cuando vista=semanal', async () => {
    jest.spyOn(semanalStrategy, 'calcular');

    await service.calcularProgreso('cliente-1', 'semanal');

    expect(semanalStrategy.calcular).toHaveBeenCalledWith([registroBase]);
  });

  it('usa ProgresoMensualStrategy cuando vista=mensual', async () => {
    jest.spyOn(mensualStrategy, 'calcular');

    await service.calcularProgreso('cliente-1', 'mensual');

    expect(mensualStrategy.calcular).toHaveBeenCalledWith([registroBase]);
  });

  it('usa ProgresoPorPlanStrategy cuando vista=porPlan y pasa contexto de asignaciones', async () => {
    jest.spyOn(porPlanStrategy, 'calcular');
    asignacionesRepository.findPorCliente.mockResolvedValue([
      {
        planDeEntrenamientoId: 'plan-abcd1234',
        asignadoEn: new Date('2026-05-01'),
        planDeEntrenamiento: {
          id: 'plan-abcd1234',
          nombre: 'Fuerza 5x5',
        },
      },
    ]);

    await service.calcularProgreso('cliente-1', 'porPlan');

    expect(porPlanStrategy.calcular).toHaveBeenCalledWith(
      [registroBase],
      expect.objectContaining({
        asignaciones: expect.arrayContaining([
          expect.objectContaining({
            planDeEntrenamientoId: 'plan-abcd1234',
            etiqueta: 'Fuerza 5x5',
          }),
        ]),
      }),
    );
  });

  it('para vista=porPlan consulta el repositorio de asignaciones', async () => {
    await service.calcularProgreso('cliente-1', 'porPlan');

    expect(asignacionesRepository.findPorCliente).toHaveBeenCalledWith('cliente-1');
  });

  it('para vista=semanal no consulta el repositorio de asignaciones', async () => {
    await service.calcularProgreso('cliente-1', 'semanal');

    expect(asignacionesRepository.findPorCliente).not.toHaveBeenCalled();
  });

  it('retorna el resultado de la strategy seleccionada', async () => {
    const resultado = await service.calcularProgreso('cliente-1', 'semanal');

    expect(resultado.totalSesiones).toBe(1);
    expect(resultado.periodos).toHaveLength(1);
    expect(resultado.periodos[0].etiqueta).toBe('25 may - 31 may');
  });

  it('vuelve a ProgresoSemanalStrategy cuando antes se consultó porPlan', async () => {
    jest.spyOn(semanalStrategy, 'calcular');
    await service.calcularProgreso('cliente-1', 'porPlan');

    const resultado = await service.calcularProgreso('cliente-1', 'semanal');

    expect(semanalStrategy.calcular).toHaveBeenCalledWith([registroBase]);
    expect(resultado.periodos[0].etiqueta).toBe('25 may - 31 may');
  });
});
