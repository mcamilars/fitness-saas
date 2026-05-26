import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { PlanesEntrenamientoRepository } from './planes-entrenamiento.repository';

describe('PlanesEntrenamientoRepository', () => {
  const prisma = {
    planDeEntrenamiento: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ejercicioPlan: {
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  let repository: PlanesEntrenamientoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PlanesEntrenamientoRepository(prisma as never);
  });

  it('crear persiste un plan de entrenamiento', async () => {
    const data = {
      nombre: 'Plan hipertrofia',
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      entrenador: { connect: { id: 'entrenador-1' } },
    };
    prisma.planDeEntrenamiento.create.mockResolvedValue({ id: 'plan-1' });

    await repository.crear(data);

    expect(prisma.planDeEntrenamiento.create).toHaveBeenCalledWith({ data });
  });

  it('findAllPorWorkspace filtra por workspace del entrenador e incluye ejercicios', async () => {
    prisma.planDeEntrenamiento.findMany.mockResolvedValue([]);

    await repository.findAllPorWorkspace('workspace-1');

    expect(prisma.planDeEntrenamiento.findMany).toHaveBeenCalledWith({
      where: { entrenador: { espacioDeTrabajoId: 'workspace-1' } },
      include: {
        entrenador: true,
        ejercicioPlanes: {
          include: { ejercicio: true },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
  });

  it('findByIdConEjercicios carga el plan con ejercicios ordenados', async () => {
    prisma.planDeEntrenamiento.findUnique.mockResolvedValue(null);

    await repository.findByIdConEjercicios('plan-1');

    expect(prisma.planDeEntrenamiento.findUnique).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      include: {
        entrenador: true,
        ejercicioPlanes: {
          include: { ejercicio: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
  });

  it('updateEstado actualiza estado del plan', async () => {
    prisma.planDeEntrenamiento.update.mockResolvedValue({ id: 'plan-1' });

    await repository.updateEstado('plan-1', EstadoPlan.ACTIVO);

    expect(prisma.planDeEntrenamiento.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { estado: EstadoPlan.ACTIVO },
    });
  });

  it('agregarEjercicioPlan crea la relación con el plan', async () => {
    const dto = {
      ejercicioId: 'ejercicio-1',
      series: 4,
      repeticiones: 10,
      segundosDeDescanso: 60,
      orden: 1,
    };
    prisma.ejercicioPlan.create.mockResolvedValue({ id: 'ejercicio-plan-1' });

    await repository.agregarEjercicioPlan('plan-1', dto);

    expect(prisma.ejercicioPlan.create).toHaveBeenCalledWith({
      data: { ...dto, planDeEntrenamientoId: 'plan-1' },
    });
  });

  it('quitarEjercicioPlan elimina la relación por id', async () => {
    prisma.ejercicioPlan.delete.mockResolvedValue({ id: 'ejercicio-plan-1' });

    await repository.quitarEjercicioPlan('ejercicio-plan-1');

    expect(prisma.ejercicioPlan.delete).toHaveBeenCalledWith({
      where: { id: 'ejercicio-plan-1' },
    });
  });

  it('contarEjercicios cuenta ejercicios del plan', async () => {
    prisma.ejercicioPlan.count.mockResolvedValue(2);

    await repository.contarEjercicios('plan-1');

    expect(prisma.ejercicioPlan.count).toHaveBeenCalledWith({
      where: { planDeEntrenamientoId: 'plan-1' },
    });
  });

  it('crearDesdeClone persiste snapshot y ejercicios clonados', async () => {
    prisma.planDeEntrenamiento.create.mockResolvedValue({ id: 'plan-clone' });

    await repository.crearDesdeClone({
      entrenadorId: 'entrenador-1',
      nombre: 'Plan (copia)',
      tipo: TipoPlanEntrenamiento.FUERZA,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: [
        {
          ejercicioId: 'ejercicio-1',
          series: 5,
          repeticiones: 5,
          segundosDeDescanso: 180,
          orden: 1,
        },
      ],
    });

    expect(prisma.planDeEntrenamiento.create).toHaveBeenCalledWith({
      data: {
        entrenadorId: 'entrenador-1',
        nombre: 'Plan (copia)',
        tipo: TipoPlanEntrenamiento.FUERZA,
        estado: EstadoPlan.BORRADOR,
        ejercicioPlanes: {
          create: [
            {
              ejercicioId: 'ejercicio-1',
              series: 5,
              repeticiones: 5,
              segundosDeDescanso: 180,
              orden: 1,
            },
          ],
        },
      },
      include: {
        entrenador: true,
        ejercicioPlanes: {
          include: { ejercicio: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
  });
});
