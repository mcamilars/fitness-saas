import { Command } from './command.interface';
import { CommandInvokerService } from './command-invoker.service';

describe('CommandInvokerService', () => {
  const crearCommand = (nombre: string): Command<string> => ({
    execute: jest.fn().mockResolvedValue(nombre),
    undo: jest.fn().mockResolvedValue(undefined),
    descripcion: jest.fn().mockReturnValue(nombre),
  });

  it('ejecutar 3 commands → undo del último deshace solo ese', async () => {
    const invoker = new CommandInvokerService();
    const primero = crearCommand('primero');
    const segundo = crearCommand('segundo');
    const tercero = crearCommand('tercero');

    await invoker.ejecutar(primero);
    await invoker.ejecutar(segundo);
    await invoker.ejecutar(tercero);
    await invoker.deshacerUltimo();

    expect(primero.undo).not.toHaveBeenCalled();
    expect(segundo.undo).not.toHaveBeenCalled();
    expect(tercero.undo).toHaveBeenCalledTimes(1);
    expect(invoker.getHistorial()).toEqual([primero, segundo]);
  });
});
