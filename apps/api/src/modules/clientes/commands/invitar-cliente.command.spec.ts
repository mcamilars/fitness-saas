import { InvitarClienteCommand } from './invitar-cliente.command';

describe('InvitarClienteCommand', () => {
  const workspaceId = 'workspace-1';
  const correo = 'cliente@test.com';

  const crearInvitacion = () => ({
    id: 'invitacion-1',
    espacioDeTrabajoId: workspaceId,
    correo,
    token: 'token-generado',
    expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
    consumida: false,
    creadoEn: new Date(),
  });

  it('execute crea invitación y llama mailer', async () => {
    const invitacion = crearInvitacion();
    const invitacionesRepository = {
      crear: jest.fn().mockResolvedValue(invitacion),
      marcarConsumidaPorId: jest.fn(),
    };
    const mailer = { enviarInvitacion: jest.fn().mockResolvedValue(undefined) };

    const command = new InvitarClienteCommand(
      invitacionesRepository as never,
      mailer as never,
      workspaceId,
      correo,
    );

    const resultado = await command.execute();

    expect(resultado).toBe(invitacion);
    expect(invitacionesRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        espacioDeTrabajoId: workspaceId,
        correo,
        token: expect.any(String),
        expiraEn: expect.any(Date),
      }),
    );
    expect(mailer.enviarInvitacion).toHaveBeenCalledWith(
      correo,
      expect.any(String),
    );
  });

  it('undo marca consumida la invitación creada', async () => {
    const invitacion = crearInvitacion();
    const invitacionesRepository = {
      crear: jest.fn().mockResolvedValue(invitacion),
      marcarConsumidaPorId: jest.fn().mockResolvedValue({ ...invitacion, consumida: true }),
    };
    const mailer = { enviarInvitacion: jest.fn().mockResolvedValue(undefined) };

    const command = new InvitarClienteCommand(
      invitacionesRepository as never,
      mailer as never,
      workspaceId,
      correo,
    );

    await command.execute();
    await command.undo();

    expect(invitacionesRepository.marcarConsumidaPorId).toHaveBeenCalledWith(
      invitacion.id,
    );
  });
});
