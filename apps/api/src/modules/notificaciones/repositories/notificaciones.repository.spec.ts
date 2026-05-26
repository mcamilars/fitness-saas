import { NotificacionesRepository } from './notificaciones.repository';

describe('NotificacionesRepository', () => {
  const prisma = {
    notificacion: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  let repository: NotificacionesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new NotificacionesRepository(prisma as never);
  });

  it('crear persiste una notificación', async () => {
    prisma.notificacion.create.mockResolvedValue({ id: 'notificacion-1' });

    await repository.crear({
      clienteId: 'cliente-1',
      mensaje: 'Plan actualizado',
    });

    expect(prisma.notificacion.create).toHaveBeenCalledWith({
      data: {
        clienteId: 'cliente-1',
        mensaje: 'Plan actualizado',
      },
    });
  });

  it('findNoLeidasPorCliente filtra por cliente y leida=false', async () => {
    prisma.notificacion.findMany.mockResolvedValue([]);

    await repository.findNoLeidasPorCliente('cliente-1');

    expect(prisma.notificacion.findMany).toHaveBeenCalledWith({
      where: { clienteId: 'cliente-1', leida: false },
      orderBy: { creadoEn: 'desc' },
    });
  });

  it('marcarLeida actualiza leida=true', async () => {
    prisma.notificacion.update.mockResolvedValue({ id: 'notificacion-1' });

    await repository.marcarLeida('notificacion-1');

    expect(prisma.notificacion.update).toHaveBeenCalledWith({
      where: { id: 'notificacion-1' },
      data: { leida: true },
    });
  });
});
