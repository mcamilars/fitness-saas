import { EstadoAsignacion } from '@repo/database';
import { AsignacionesEntrenamientoRepository } from './asignaciones-entrenamiento.repository';

describe('AsignacionesEntrenamientoRepository', () => {
  const prisma = {
    asignacionPlanEntrenamiento: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  let repository: AsignacionesEntrenamientoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new AsignacionesEntrenamientoRepository(prisma as never);
  });

  it('crear persiste una asignación activa por defecto', async () => {
    prisma.asignacionPlanEntrenamiento.create.mockResolvedValue({
      id: 'asignacion-1',
    });

    await repository.crear({
      clienteId: 'cliente-1',
      planDeEntrenamientoId: 'plan-1',
    });

    expect(prisma.asignacionPlanEntrenamiento.create).toHaveBeenCalledWith({
      data: {
        clienteId: 'cliente-1',
        planDeEntrenamientoId: 'plan-1',
        estado: EstadoAsignacion.ACTIVO,
      },
    });
  });

  it('findPorCliente filtra por cliente', async () => {
    prisma.asignacionPlanEntrenamiento.findMany.mockResolvedValue([]);

    await repository.findPorCliente('cliente-1');

    expect(prisma.asignacionPlanEntrenamiento.findMany).toHaveBeenCalledWith({
      where: { clienteId: 'cliente-1' },
      orderBy: { asignadoEn: 'desc' },
    });
  });

  it('findPorPlan filtra por plan', async () => {
    prisma.asignacionPlanEntrenamiento.findMany.mockResolvedValue([]);

    await repository.findPorPlan('plan-1');

    expect(prisma.asignacionPlanEntrenamiento.findMany).toHaveBeenCalledWith({
      where: { planDeEntrenamientoId: 'plan-1' },
      orderBy: { asignadoEn: 'desc' },
    });
  });

  it('updateEstado actualiza el estado', async () => {
    prisma.asignacionPlanEntrenamiento.update.mockResolvedValue({
      id: 'asignacion-1',
    });

    await repository.updateEstado('asignacion-1', EstadoAsignacion.INACTIVO);

    expect(prisma.asignacionPlanEntrenamiento.update).toHaveBeenCalledWith({
      where: { id: 'asignacion-1' },
      data: { estado: EstadoAsignacion.INACTIVO },
    });
  });

  it('findActivaPorCliente busca la asignación activa más reciente', async () => {
    prisma.asignacionPlanEntrenamiento.findFirst.mockResolvedValue(null);

    await repository.findActivaPorCliente('cliente-1');

    expect(prisma.asignacionPlanEntrenamiento.findFirst).toHaveBeenCalledWith({
      where: { clienteId: 'cliente-1', estado: EstadoAsignacion.ACTIVO },
      orderBy: { asignadoEn: 'desc' },
    });
  });
});
