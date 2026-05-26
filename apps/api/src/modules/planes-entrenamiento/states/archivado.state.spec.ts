import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
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
  const repository = {};

  it('activar lanza error', async () => {
    const state = new ArchivadoState();

    await expect(
      state.activar(plan, { repository: repository as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('archivar lanza error', async () => {
    const state = new ArchivadoState();

    await expect(
      state.archivar(plan, { repository: repository as never }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
