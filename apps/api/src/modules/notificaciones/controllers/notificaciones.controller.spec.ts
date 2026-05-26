import { NotificacionesController } from './notificaciones.controller';

describe('NotificacionesController', () => {
  const service = {
    findNoLeidasPorUsuario: jest.fn(),
    marcarLeida: jest.fn(),
  };

  let controller: NotificacionesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new NotificacionesController(service as never);
  });

  it('lista notificaciones no leídas para el usuario autenticado', async () => {
    service.findNoLeidasPorUsuario.mockResolvedValue([]);

    await controller.findNoLeidas({
      id: 'usuario-1',
      rol: 'CLIENTE',
      workspaceId: 'workspace-1',
    });

    expect(service.findNoLeidasPorUsuario).toHaveBeenCalledWith('usuario-1');
  });

  it('marca notificación como leída', async () => {
    service.marcarLeida.mockResolvedValue({ id: 'notificacion-1' });

    await controller.marcarLeida('notificacion-1');

    expect(service.marcarLeida).toHaveBeenCalledWith('notificacion-1');
  });
});
