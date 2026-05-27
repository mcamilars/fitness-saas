import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { ArchivarPlanCommand } from './archivar-plan.command';

describe('ArchivarPlanCommand', () => {
  const planId = 'plan-1';
  const workspaceId = 'workspace-1';

  const planActivo = {
    id: planId,
    entrenadorId: 'entrenador-1',
    nombre: 'Plan test',
    descripcion: null,
    tipo: TipoPlanEntrenamiento.HIPERTROFIA,
    estado: EstadoPlan.ACTIVO,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    entrenador: { id: 'entrenador-1', espacioDeTrabajoId: workspaceId },
    ejercicioPlanes: [],
  };

  const planArchivado = { ...planActivo, estado: EstadoPlan.ARCHIVADO };

  it('execute guarda estadoPrevio y archiva el plan', async () => {
    const planesService = {
      findById: jest.fn().mockResolvedValue(planActivo),
      archivar: jest.fn().mockResolvedValue(planArchivado),
      restaurarEstadoDesdeCommand: jest.fn(),
    };

    const command = new ArchivarPlanCommand(
      planesService as never,
      planId,
      workspaceId,
    );

    const result = await command.execute();

    expect(planesService.findById).toHaveBeenCalledWith(planId, workspaceId);
    expect(planesService.archivar).toHaveBeenCalledWith(planId, workspaceId);
    expect(result).toEqual(planArchivado);
  });

  it('undo restaura el estado previo si era ACTIVO', async () => {
    const planesService = {
      findById: jest.fn().mockResolvedValue(planActivo),
      archivar: jest.fn().mockResolvedValue(planArchivado),
      restaurarEstadoDesdeCommand: jest.fn().mockResolvedValue(planActivo),
    };

    const command = new ArchivarPlanCommand(
      planesService as never,
      planId,
      workspaceId,
    );

    await command.execute();
    await command.undo();

    expect(planesService.restaurarEstadoDesdeCommand).toHaveBeenCalledWith(
      planId,
      workspaceId,
      EstadoPlan.ACTIVO,
    );
  });

  it('undo no hace nada si el estadoPrevio era BORRADOR', async () => {
    const planesService = {
      findById: jest.fn().mockResolvedValue({
        ...planActivo,
        estado: EstadoPlan.BORRADOR,
      }),
      archivar: jest.fn().mockResolvedValue(planArchivado),
      restaurarEstadoDesdeCommand: jest.fn(),
    };

    const command = new ArchivarPlanCommand(
      planesService as never,
      planId,
      workspaceId,
    );

    await command.execute();
    await command.undo();

    expect(planesService.restaurarEstadoDesdeCommand).not.toHaveBeenCalled();
  });

  it('undo no hace nada si execute no fue llamado antes', async () => {
    const planesService = {
      findById: jest.fn(),
      archivar: jest.fn(),
      restaurarEstadoDesdeCommand: jest.fn(),
    };

    const command = new ArchivarPlanCommand(
      planesService as never,
      planId,
      workspaceId,
    );

    await command.undo();

    expect(planesService.restaurarEstadoDesdeCommand).not.toHaveBeenCalled();
  });

  it('descripcion describe la operación', () => {
    const command = new ArchivarPlanCommand(
      {
        findById: jest.fn(),
        archivar: jest.fn(),
        restaurarEstadoDesdeCommand: jest.fn(),
      } as never,
      planId,
      workspaceId,
    );

    expect(command.descripcion()).toBe(
      `Archivar plan ${planId} del workspace ${workspaceId}`,
    );
  });
});
