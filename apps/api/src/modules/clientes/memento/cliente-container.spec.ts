import { ClienteContainer } from './cliente-container';
import type { ClienteSnapshot } from './cliente.memento';

const crearSnapshot = (id: string, estaActivo: boolean): ClienteSnapshot => ({
  id,
  usuarioId: `usuario-${id}`,
  entrenadorId: 'entrenador-1',
  espacioDeTrabajoId: 'workspace-1',
  estaActivo,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: '2026-01-02T00:00:00.000Z',
});

describe('ClienteContainer', () => {
  it('guarda dos mementos y restaura primero el último', () => {
    const container = new ClienteContainer();
    const primerSnapshot = crearSnapshot('cliente-1', true);
    const segundoSnapshot = crearSnapshot('cliente-1', false);

    container.guardar('cliente-1', primerSnapshot);
    container.guardar('cliente-1', segundoSnapshot);

    expect(container.restaurarUltimo('cliente-1')?.getEstado()).toEqual(
      segundoSnapshot,
    );
    expect(container.restaurarUltimo('cliente-1')?.getEstado()).toEqual(
      primerSnapshot,
    );
    expect(container.restaurarUltimo('cliente-1')).toBeNull();
  });

  it('mantiene historiales independientes por cliente', () => {
    const container = new ClienteContainer();
    const snapshotA = crearSnapshot('cliente-a', true);
    const snapshotB = crearSnapshot('cliente-b', false);

    container.guardar('cliente-a', snapshotA);
    container.guardar('cliente-b', snapshotB);

    expect(container.restaurarUltimo('cliente-a')?.getEstado()).toEqual(
      snapshotA,
    );
    expect(container.restaurarUltimo('cliente-b')?.getEstado()).toEqual(
      snapshotB,
    );
  });
});
