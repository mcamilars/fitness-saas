import type { Command } from '../../../commands/command.interface';
import { DesactivarClienteCommand } from '../commands/desactivar-cliente.command';
import { InvitarClienteCommand } from '../commands/invitar-cliente.command';
import { ClientesController } from './clientes.controller';

describe('ClientesController', () => {
  const workspaceId = 'workspace-1';

  const cliente = {
    id: 'cliente-1',
    usuarioId: 'usuario-1',
    entrenadorId: 'entrenador-1',
    espacioDeTrabajoId: workspaceId,
    estaActivo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    usuario: {},
  };

  const construir = () => {
    const clientesService = {
      findAllPorWorkspace: jest.fn().mockResolvedValue([cliente]),
      findById: jest.fn().mockResolvedValue(cliente),
      update: jest.fn().mockResolvedValue(cliente),
      softDelete: jest.fn().mockResolvedValue({ ...cliente, estaActivo: false }),
      restaurar: jest.fn().mockResolvedValue(cliente),
    };
    const invitacionesRepository = {
      crear: jest.fn().mockResolvedValue({ id: 'invitacion-1' }),
      marcarConsumidaPorId: jest.fn(),
    };
    const mailer = { enviarInvitacion: jest.fn().mockResolvedValue(undefined) };
    // El invoker ejecuta el command realmente, para validar que el controller
    // arma el Command correcto y lo delega al patrón Command.
    const commandInvoker = {
      ejecutar: jest.fn((command: Command) => command.execute()),
    };

    const controller = new ClientesController(
      invitacionesRepository as never,
      mailer as never,
      commandInvoker as never,
      clientesService as never,
    );

    return { controller, clientesService, invitacionesRepository, mailer, commandInvoker };
  };

  it('findAll delega en el servicio y envuelve la respuesta', async () => {
    const { controller, clientesService } = construir();

    await expect(controller.findAll(workspaceId)).resolves.toEqual({
      clientes: [cliente],
    });
    expect(clientesService.findAllPorWorkspace).toHaveBeenCalledWith(workspaceId);
  });

  it('findById delega en el servicio', async () => {
    const { controller, clientesService } = construir();

    await expect(controller.findById('cliente-1', workspaceId)).resolves.toEqual({
      cliente,
    });
    expect(clientesService.findById).toHaveBeenCalledWith('cliente-1', workspaceId);
  });

  it('update delega en el servicio con el dto', async () => {
    const { controller, clientesService } = construir();
    const dto = { estaActivo: false };

    await expect(
      controller.update('cliente-1', dto as never, workspaceId),
    ).resolves.toEqual({ cliente });
    expect(clientesService.update).toHaveBeenCalledWith('cliente-1', dto, workspaceId);
  });

  it('softDelete ejecuta un DesactivarClienteCommand a través del invoker', async () => {
    const { controller, clientesService, commandInvoker } = construir();

    const resultado = await controller.softDelete('cliente-1', workspaceId);

    expect(commandInvoker.ejecutar).toHaveBeenCalledWith(
      expect.any(DesactivarClienteCommand),
    );
    expect(clientesService.softDelete).toHaveBeenCalledWith('cliente-1', workspaceId);
    expect(resultado.cliente).toMatchObject({ estaActivo: false });
  });

  it('restaurar delega en el servicio', async () => {
    const { controller, clientesService } = construir();

    await expect(controller.restaurar('cliente-1', workspaceId)).resolves.toEqual({
      cliente,
    });
    expect(clientesService.restaurar).toHaveBeenCalledWith('cliente-1', workspaceId);
  });

  it('invitar ejecuta un InvitarClienteCommand a través del invoker', async () => {
    const { controller, commandInvoker, invitacionesRepository, mailer } =
      construir();

    const resultado = await controller.invitar(
      { correo: 'nuevo@test.com' } as never,
      workspaceId,
    );

    expect(commandInvoker.ejecutar).toHaveBeenCalledWith(
      expect.any(InvitarClienteCommand),
    );
    expect(invitacionesRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        espacioDeTrabajoId: workspaceId,
        correo: 'nuevo@test.com',
      }),
    );
    expect(mailer.enviarInvitacion).toHaveBeenCalledWith(
      'nuevo@test.com',
      expect.any(String),
    );
    expect(resultado).toEqual({ invitacion: { id: 'invitacion-1' } });
  });
});
