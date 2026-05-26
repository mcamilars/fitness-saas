export type ClienteSnapshot = Readonly<{
  id: string;
  usuarioId: string;
  entrenadorId: string;
  espacioDeTrabajoId: string;
  estaActivo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}>;

function clonarSnapshot(snapshot: ClienteSnapshot): ClienteSnapshot {
  return Object.freeze({ ...snapshot });
}

export class ClienteMemento {
  private readonly estado: ClienteSnapshot;
  private readonly timestamp: Date;

  constructor(estado: ClienteSnapshot, timestamp = new Date()) {
    this.estado = clonarSnapshot(estado);
    this.timestamp = new Date(timestamp);
  }

  getEstado(): ClienteSnapshot {
    return clonarSnapshot(this.estado);
  }

  getTimestamp(): Date {
    return new Date(this.timestamp);
  }
}
