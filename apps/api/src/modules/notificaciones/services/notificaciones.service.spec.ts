import { NotFoundException } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
  const repository = {
    findNoLeidasPorCliente: jest.fn(),
    marcarLeida: jest.fn(),
  };
  const clientesRepository = {
    findByUsuarioId: jest.fn(),
  };

  let service: NotificacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificacionesService(
      repository as never,
      clientesRepository as never,
    );
  });

  it('lista notificaciones no leídas del cliente asociado al usuario', async () => {
    clientesRepository.findByUsuarioId.mockResolvedValue({ id: 'cliente-1' });
    repository.findNoLeidasPorCliente.mockResolvedValue([]);

    await service.findNoLeidasPorUsuario('usuario-1');

    expect(repository.findNoLeidasPorCliente).toHaveBeenCalledWith('cliente-1');
  });

  it('lanza NotFound si el usuario no tiene cliente', async () => {
    clientesRepository.findByUsuarioId.mockResolvedValue(null);

    await expect(
      service.findNoLeidasPorUsuario('usuario-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marcarLeida delega al repositorio', async () => {
    repository.marcarLeida.mockResolvedValue({ id: 'notificacion-1' });

    await service.marcarLeida('notificacion-1');

    expect(repository.marcarLeida).toHaveBeenCalledWith('notificacion-1');
  });
});
