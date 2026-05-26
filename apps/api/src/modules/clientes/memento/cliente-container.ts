import { Injectable } from '@nestjs/common';
import { ClienteMemento, type ClienteSnapshot } from './cliente.memento';

@Injectable()
export class ClienteContainer {
  private readonly mementos = new Map<string, ClienteMemento[]>();

  guardar(clienteId: string, snapshot: ClienteSnapshot): ClienteMemento {
    const memento = new ClienteMemento(snapshot);
    const historial = this.mementos.get(clienteId) ?? [];

    historial.push(memento);
    this.mementos.set(clienteId, historial);

    return memento;
  }

  restaurarUltimo(clienteId: string): ClienteMemento | null {
    const historial = this.mementos.get(clienteId);

    if (!historial?.length) {
      return null;
    }

    const memento = historial.pop() ?? null;

    if (historial.length === 0) {
      this.mementos.delete(clienteId);
    }

    return memento;
  }
}
