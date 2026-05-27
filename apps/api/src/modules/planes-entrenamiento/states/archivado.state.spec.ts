import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { ActivoState } from './activo.state';
import { ArchivadoState } from './archivado.state';

describe('ArchivadoState', () => {
  const plan = {
    id: 'plan-1',
    entrenadorId: 'entrenador-1',
    nombre: 'Plan',
    descripcion: null,
    tipo: TipoPlanEntrenamiento.RESISTENCIA,
    estado: EstadoPlan.ARCHIVADO,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };
  const repository = { updateEstado: jest.fn().mockResolvedValue(undefined) };
  const subject = { notify: jest.fn().mockResolvedValue(undefined) };

  it('activar transiciona a ActivoState', async () => {
    const state = new ArchivadoState();
    const nextState = await state.activar(plan, {
      repository: repository as never,
      subject: subject as never,
    });

    expect(repository.updateEstado).toHaveBeenCalledWith(plan.id, EstadoPlan.ACTIVO);
    expect(subject.notify).toHaveBeenCalledWith(plan.id, {
      tipo: 'PLAN_ACTIVADO',
      planId: plan.id,
    });
    expect(nextState).toBeInstanceOf(ActivoState);
  });

  it('archivar lanza error', async () => {
    const state = new ArchivadoState();

    await expect(
      state.archivar(plan, { repository: repository as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
