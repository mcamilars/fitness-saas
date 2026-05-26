import { Injectable } from '@nestjs/common';
import { Command } from './command.interface';

@Injectable()
export class CommandInvokerService {
  private readonly historial: Command[] = [];
  private readonly maxHistorial = 50;

  async ejecutar<T>(command: Command<T>): Promise<T> {
    const resultado = await command.execute();
    this.historial.push(command);
    this.recortarHistorial();

    return resultado;
  }

  async deshacer(): Promise<void> {
    const command = this.historial.pop();

    if (!command) {
      return;
    }

    await command.undo();
  }

  async deshacerUltimo(): Promise<void> {
    await this.deshacer();
  }

  getHistorial(): Command[] {
    return [...this.historial];
  }

  private recortarHistorial(): void {
    if (this.historial.length <= this.maxHistorial) {
      return;
    }

    this.historial.splice(0, this.historial.length - this.maxHistorial);
  }
}
