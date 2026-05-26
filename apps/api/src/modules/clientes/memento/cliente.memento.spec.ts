import { ClienteMemento, type ClienteSnapshot } from './cliente.memento';

const snapshot: ClienteSnapshot = {
  id: 'cliente-1',
  usuarioId: 'usuario-1',
  entrenadorId: 'entrenador-1',
  espacioDeTrabajoId: 'workspace-1',
  estaActivo: true,
  creadoEn: '2026-01-01T00:00:00.000Z',
  actualizadoEn: '2026-01-02T00:00:00.000Z',
};

describe('ClienteMemento', () => {
  it('guarda un snapshot inmutable', () => {
    const memento = new ClienteMemento(snapshot);
    const estado = memento.getEstado();

    expect(estado).toEqual(snapshot);
    expect(Object.isFrozen(estado)).toBe(true);
    expect(() => {
      (estado as { estaActivo: boolean }).estaActivo = false;
    }).toThrow(TypeError);
    expect(memento.getEstado().estaActivo).toBe(true);
  });

  it('expone una copia defensiva del timestamp', () => {
    const fecha = new Date('2026-01-03T00:00:00.000Z');
    const memento = new ClienteMemento(snapshot, fecha);
    const timestamp = memento.getTimestamp();

    timestamp.setFullYear(2030);

    expect(memento.getTimestamp()).toEqual(fecha);
    expect(memento.getTimestamp()).not.toBe(fecha);
  });
});
