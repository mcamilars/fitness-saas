import { UsuariosRepository } from './usuarios.repository';

describe('UsuariosRepository', () => {
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let repository: UsuariosRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UsuariosRepository(prisma as never);
  });

  it('findByCorreo consulta por correo único', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await repository.findByCorreo('coach@test.com');

    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { correo: 'coach@test.com' },
    });
  });

  it('crear usa el cliente de transacción cuando se provee tx', async () => {
    const tx = { usuario: { create: jest.fn().mockResolvedValue({ id: 'u-1' }) } };
    const data = { correo: 'c@test.com' };

    await repository.crear(data as never, tx as never);

    expect(tx.usuario.create).toHaveBeenCalledWith({ data });
    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('crear usa el prisma por defecto cuando no se provee tx', async () => {
    prisma.usuario.create.mockResolvedValue({ id: 'u-2' });
    const data = { correo: 'd@test.com' };

    await repository.crear(data as never);

    expect(prisma.usuario.create).toHaveBeenCalledWith({ data });
  });

  it('conTransaccion delega en prisma.$transaction y propaga el resultado del callback', async () => {
    const txCliente = Symbol('tx');
    prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
      cb(txCliente),
    );
    const callback = jest.fn().mockResolvedValue('resultado-final');

    const resultado = await repository.conTransaccion(callback);

    expect(prisma.$transaction).toHaveBeenCalledWith(callback);
    expect(callback).toHaveBeenCalledWith(txCliente);
    expect(resultado).toBe('resultado-final');
  });
});
