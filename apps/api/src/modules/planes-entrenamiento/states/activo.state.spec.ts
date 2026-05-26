import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { ActivoState } from './activo.state';
import { ArchivadoState } from './archivado.state';

describe('ActivoState', () => {
  const plan = {
    id: 'plan-1',
    entrenadorId: 'entrenador-1',
    nombre: 'Plan',
    descripcion: null,
    tipo: TipoPlanEntrenamiento.FUERZA,
    estado: EstadoPlan.ACTIVO,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };
  const repository = { updateEstado: jest.fn() };
  const subject = { notify: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('archivar transiciona a ArchivadoState y notifica', async () => {
    repository.updateEstado.mockResolvedValue({ ...plan, estado: EstadoPlan.ARCHIVADO });
    const state = new ActivoState();

    const nextState = await state.archivar(plan, {
      repository: repository as never,
      subject,
    });

    expect(repository.updateEstado).toHaveBeenCalledWith('plan-1', EstadoPlan.ARCHIVADO);
    expect(subject.notify).toHaveBeenCalledWith('plan-1', {
      tipo: 'PLAN_ARCHIVADO',
      planId: 'plan-1',
    });
    expect(nextState).toBeInstanceOf(ArchivadoState);
  });

  it('activar lanza error', async () => {
    const state = new ActivoState();

    await expect(
      state.activar(plan, { repository: repository as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
