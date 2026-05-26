import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { ActivoState } from './activo.state';
import { BorradorState } from './borrador.state';

describe('BorradorState', () => {
  const plan = {
    id: 'plan-1',
    entrenadorId: 'entrenador-1',
    nombre: 'Plan',
    descripcion: null,
    tipo: TipoPlanEntrenamiento.HIPERTROFIA,
    estado: EstadoPlan.BORRADOR,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  const repository = {
    contarEjercicios: jest.fn(),
    updateEstado: jest.fn(),
  };
  const subject = { notify: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('activar sin ejercicios lanza error', async () => {
    repository.contarEjercicios.mockResolvedValue(0);
    const state = new BorradorState();

    await expect(
      state.activar(plan, { repository: repository as never, subject }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateEstado).not.toHaveBeenCalled();
  });

  it('activar con ejercicios transiciona a ActivoState y notifica', async () => {
    repository.contarEjercicios.mockResolvedValue(1);
    repository.updateEstado.mockResolvedValue({ ...plan, estado: EstadoPlan.ACTIVO });
    const state = new BorradorState();

    const nextState = await state.activar(plan, {
      repository: repository as never,
      subject,
    });

    expect(repository.updateEstado).toHaveBeenCalledWith('plan-1', EstadoPlan.ACTIVO);
    expect(subject.notify).toHaveBeenCalledWith('plan-1', {
      tipo: 'PLAN_ACTIVADO',
      planId: 'plan-1',
    });
    expect(nextState).toBeInstanceOf(ActivoState);
  });

  it('archivar lanza error', async () => {
    const state = new BorradorState();

    await expect(
      state.archivar(plan, { repository: repository as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
