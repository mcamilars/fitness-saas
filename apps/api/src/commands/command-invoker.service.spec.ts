import type { Command } from './command.interface';
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

  it('deshacer con historial vacío no lanza error', async () => {
    const invoker = new CommandInvokerService();

    await expect(invoker.deshacer()).resolves.toBeUndefined();
    expect(invoker.getHistorial()).toEqual([]);
  });

  it('mantiene el historial acotado a 50 commands descartando el más antiguo', async () => {
    const invoker = new CommandInvokerService();

    for (let i = 0; i < 55; i += 1) {
      await invoker.ejecutar(crearCommand(`command-${i}`));
    }

    const historial = invoker.getHistorial();
    expect(historial).toHaveLength(50);
    expect(historial[0].descripcion()).toBe('command-5');
    expect(historial[49].descripcion()).toBe('command-54');
  });

  it('un command que falla al ejecutar no queda en el historial', async () => {
    const invoker = new CommandInvokerService();
    const command: Command<string> = {
      execute: jest.fn().mockRejectedValue(new Error('boom')),
      undo: jest.fn(),
      descripcion: jest.fn().mockReturnValue('fallido'),
    };

    await expect(invoker.ejecutar(command)).rejects.toThrow('boom');
    expect(invoker.getHistorial()).toEqual([]);
  });

  it('getHistorial devuelve una copia que no muta el estado interno', async () => {
    const invoker = new CommandInvokerService();
    await invoker.ejecutar(crearCommand('primero'));

    const copia = invoker.getHistorial();
    copia.pop();

    expect(invoker.getHistorial()).toHaveLength(1);
  });
});
