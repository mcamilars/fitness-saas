import { ClientesRepository } from './clientes.repository';

// Selección esperada del usuario: campos públicos, sin `contrasenaHash`.
const usuarioPublicoInclude = {
  usuario: {
    select: {
      id: true,
      correo: true,
      nombre: true,
      apellido: true,
      rol: true,
      estaActivo: true,
      creadoEn: true,
      actualizadoEn: true,
    },
  },
};

describe('ClientesRepository', () => {
  const prisma = {
    cliente: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  let repository: ClientesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new ClientesRepository(prisma as never);
  });

  it('findAllPorWorkspace filtra por workspace e incluye usuario', async () => {
    prisma.cliente.findMany.mockResolvedValue([]);

    await repository.findAllPorWorkspace('workspace-1');

    expect(prisma.cliente.findMany).toHaveBeenCalledWith({
      where: { espacioDeTrabajoId: 'workspace-1' },
      include: usuarioPublicoInclude,
      orderBy: { creadoEn: 'desc' },
    });
  });

  it('findByIdConPerfil filtra por id y workspace cuando se recibe', async () => {
    prisma.cliente.findFirst.mockResolvedValue(null);

    await repository.findByIdConPerfil('cliente-1', 'workspace-1');

    expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
      where: { id: 'cliente-1', espacioDeTrabajoId: 'workspace-1' },
      include: usuarioPublicoInclude,
    });
  });

  it('update filtra por workspace cuando se recibe', async () => {
    prisma.cliente.updateMany.mockResolvedValue({ count: 1 });
    prisma.cliente.findFirst.mockResolvedValue({ id: 'cliente-1' });

    await repository.update(
      'cliente-1',
      { estaActivo: false },
      'workspace-1',
    );

    expect(prisma.cliente.updateMany).toHaveBeenCalledWith({
      where: { id: 'cliente-1', espacioDeTrabajoId: 'workspace-1' },
      data: { estaActivo: false },
    });
    expect(prisma.cliente.findFirst).toHaveBeenCalledWith({
      where: { id: 'cliente-1', espacioDeTrabajoId: 'workspace-1' },
      include: usuarioPublicoInclude,
    });
  });

  it('setActivo actualiza estaActivo respetando workspace', async () => {
    prisma.cliente.updateMany.mockResolvedValue({ count: 1 });
    prisma.cliente.findFirst.mockResolvedValue({ id: 'cliente-1', estaActivo: false });

    await repository.setActivo('cliente-1', false, 'workspace-1');

    expect(prisma.cliente.updateMany).toHaveBeenCalledWith({
      where: { id: 'cliente-1', espacioDeTrabajoId: 'workspace-1' },
      data: { estaActivo: false },
    });
  });
});
