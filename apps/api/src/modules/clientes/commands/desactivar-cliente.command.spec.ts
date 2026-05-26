import { DesactivarClienteCommand } from './desactivar-cliente.command';

describe('DesactivarClienteCommand', () => {
  const clienteId = 'cliente-1';
  const workspaceId = 'workspace-1';

  const cliente = {
    id: clienteId,
    usuarioId: 'usuario-1',
    entrenadorId: 'entrenador-1',
    espacioDeTrabajoId: workspaceId,
    estaActivo: false,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    usuario: {},
  };

  it('execute desactiva el cliente y guarda su id', async () => {
    const clientesService = {
      softDelete: jest.fn().mockResolvedValue(cliente),
      restaurar: jest.fn(),
    };
    const command = new DesactivarClienteCommand(
      clientesService as never,
      clienteId,
      workspaceId,
    );

    await expect(command.execute()).resolves.toBe(cliente);

    expect(clientesService.softDelete).toHaveBeenCalledWith(
      clienteId,
      workspaceId,
    );
  });

  it('undo restaura el cliente desactivado por execute', async () => {
    const clientesService = {
      softDelete: jest.fn().mockResolvedValue(cliente),
      restaurar: jest.fn().mockResolvedValue({ ...cliente, estaActivo: true }),
    };
    const command = new DesactivarClienteCommand(
      clientesService as never,
      clienteId,
      workspaceId,
    );

    await command.execute();
    await command.undo();

    expect(clientesService.restaurar).toHaveBeenCalledWith(
      clienteId,
      workspaceId,
    );
  });

  it('undo no hace nada si execute no se ejecutó', async () => {
    const clientesService = {
      softDelete: jest.fn(),
      restaurar: jest.fn(),
    };
    const command = new DesactivarClienteCommand(
      clientesService as never,
      clienteId,
      workspaceId,
    );

    await command.undo();

    expect(clientesService.restaurar).not.toHaveBeenCalled();
  });

  it('descripcion describe la operación', () => {
    const command = new DesactivarClienteCommand(
      { softDelete: jest.fn(), restaurar: jest.fn() } as never,
      clienteId,
      workspaceId,
    );

    expect(command.descripcion()).toBe(
      `Desactivar cliente ${clienteId} del workspace ${workspaceId}`,
    );
  });
});
