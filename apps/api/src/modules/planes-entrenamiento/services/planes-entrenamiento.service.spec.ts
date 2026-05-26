import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { PlanesEntrenamientoService } from './planes-entrenamiento.service';

describe('PlanesEntrenamientoService', () => {
  const plan = {
    id: 'plan-1',
    entrenadorId: 'entrenador-1',
    nombre: 'Plan',
    descripcion: null,
    tipo: TipoPlanEntrenamiento.HIPERTROFIA,
    estado: EstadoPlan.BORRADOR,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    entrenador: {
      id: 'entrenador-1',
      usuarioId: 'usuario-1',
      espacioDeTrabajoId: 'workspace-1',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
    ejercicioPlanes: [],
  };

  const repository = {
    crear: jest.fn(),
    findAllPorWorkspace: jest.fn(),
    findByIdConEjercicios: jest.fn(),
    crearDesdeClone: jest.fn(),
    agregarEjercicioPlan: jest.fn(),
    quitarEjercicioPlan: jest.fn(),
  };
  const entrenadoresRepository = {
    findByUsuarioId: jest.fn(),
  };
  const factoriesProvider = {
    obtener: jest.fn(),
  };
  const state = {
    activar: jest.fn(),
    archivar: jest.fn(),
  };
  const stateFactory = {
    fromEstado: jest.fn(),
  };
  const subject = {
    notify: jest.fn(),
  };

  let service: PlanesEntrenamientoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlanesEntrenamientoService(
      repository as never,
      entrenadoresRepository as never,
      factoriesProvider as never,
      stateFactory as never,
      subject as never,
    );
  });

  it('crear elige factory y persiste plan en borrador', async () => {
    factoriesProvider.obtener.mockReturnValue({
      crear: jest.fn().mockReturnValue({
        nombre: 'Plan hipertrofia',
        descripcion: 'Desc',
        tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      }),
    });
    repository.crear.mockResolvedValue({ id: 'plan-1' });

    await service.crear(
      TipoPlanEntrenamiento.HIPERTROFIA,
      {
        nombre: 'Plan hipertrofia',
        descripcion: 'Desc',
        tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      },
      'entrenador-1',
    );

    expect(factoriesProvider.obtener).toHaveBeenCalledWith(
      TipoPlanEntrenamiento.HIPERTROFIA,
    );
    expect(repository.crear).toHaveBeenCalledWith({
      nombre: 'Plan hipertrofia',
      descripcion: 'Desc',
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      estado: EstadoPlan.BORRADOR,
      entrenador: { connect: { id: 'entrenador-1' } },
    });
  });

  it('findById lanza NotFound si no existe', async () => {
    repository.findByIdConEjercicios.mockResolvedValue(null);

    await expect(service.findById('plan-1', 'workspace-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findById lanza Forbidden si el plan no pertenece al workspace', async () => {
    repository.findByIdConEjercicios.mockResolvedValue(plan);

    await expect(service.findById('plan-1', 'workspace-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('activar delega la transición al state correspondiente', async () => {
    repository.findByIdConEjercicios
      .mockResolvedValueOnce(plan)
      .mockResolvedValueOnce({ ...plan, estado: EstadoPlan.ACTIVO });
    stateFactory.fromEstado.mockReturnValue(state);
    state.activar.mockResolvedValue(undefined);

    await service.activar('plan-1', 'workspace-1');

    expect(stateFactory.fromEstado).toHaveBeenCalledWith(EstadoPlan.BORRADOR);
    expect(state.activar).toHaveBeenCalledWith(plan, {
      repository,
      subject,
    });
  });

  it('duplicar clona el plan y persiste el snapshot', async () => {
    repository.findByIdConEjercicios.mockResolvedValue(plan);
    repository.crearDesdeClone.mockResolvedValue({ ...plan, id: 'plan-2' });

    await service.duplicar('plan-1', 'workspace-1');

    expect(repository.crearDesdeClone).toHaveBeenCalledWith({
      entrenadorId: 'entrenador-1',
      nombre: 'Plan (copia)',
      descripcion: null,
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: [],
    });
  });

  it('agregarEjercicio notifica cuando el plan está activo', async () => {
    repository.findByIdConEjercicios.mockResolvedValue({
      ...plan,
      estado: EstadoPlan.ACTIVO,
    });
    repository.agregarEjercicioPlan.mockResolvedValue({ id: 'ejercicio-plan-1' });

    await service.agregarEjercicio(
      'plan-1',
      {
        ejercicioId: 'ejercicio-1',
        series: 4,
        repeticiones: 10,
        orden: 1,
      },
      'workspace-1',
    );

    expect(subject.notify).toHaveBeenCalledWith('plan-1', {
      tipo: 'PLAN_MODIFICADO',
      planId: 'plan-1',
    });
  });
});
