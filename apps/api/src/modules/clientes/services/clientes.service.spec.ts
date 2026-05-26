import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClienteContainer } from '../memento/cliente-container';
import { ClientesService } from './clientes.service';

const crearCliente = (overrides = {}) => ({
  id: 'cliente-1',
  usuarioId: 'usuario-1',
  entrenadorId: 'entrenador-1',
  espacioDeTrabajoId: 'workspace-1',
  estaActivo: true,
  creadoEn: new Date('2026-01-01T00:00:00.000Z'),
  actualizadoEn: new Date('2026-01-02T00:00:00.000Z'),
  usuario: {
    id: 'usuario-1',
    correo: 'cliente@test.com',
    contrasenaHash: 'hash',
    nombre: 'Cliente',
    apellido: 'Demo',
    rol: 'CLIENTE',
    estaActivo: true,
    creadoEn: new Date('2026-01-01T00:00:00.000Z'),
    actualizadoEn: new Date('2026-01-02T00:00:00.000Z'),
  },
  ...overrides,
});

describe('ClientesService', () => {
  const repository = {
    findAllPorWorkspace: jest.fn(),
    findByIdConPerfil: jest.fn(),
    update: jest.fn(),
    setActivo: jest.fn(),
  };

  let container: ClienteContainer;
  let service: ClientesService;

  beforeEach(() => {
    jest.clearAllMocks();
    container = new ClienteContainer();
    service = new ClientesService(repository as never, container);
  });

  it('findAllPorWorkspace delega al repositorio', async () => {
    repository.findAllPorWorkspace.mockResolvedValue([]);

    await expect(service.findAllPorWorkspace('workspace-1')).resolves.toEqual([]);

    expect(repository.findAllPorWorkspace).toHaveBeenCalledWith('workspace-1');
  });

  it('findById retorna el cliente cuando pertenece al workspace', async () => {
    const cliente = crearCliente();
    repository.findByIdConPerfil.mockResolvedValue(cliente);

    await expect(service.findById('cliente-1', 'workspace-1')).resolves.toBe(
      cliente,
    );
  });

  it('findById lanza Forbidden si el cliente pertenece a otro workspace', async () => {
    repository.findByIdConPerfil.mockResolvedValue(
      crearCliente({ espacioDeTrabajoId: 'workspace-2' }),
    );

    await expect(service.findById('cliente-1', 'workspace-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('findById lanza NotFound si el cliente no existe', async () => {
    repository.findByIdConPerfil.mockResolvedValue(null);

    await expect(
      service.findById('cliente-1', 'workspace-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update lanza NotFound si el repositorio no devuelve el cliente actualizado', async () => {
    repository.findByIdConPerfil.mockResolvedValue(crearCliente());
    repository.update.mockResolvedValue(null);

    await expect(
      service.update('cliente-1', { estaActivo: true }, 'workspace-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('softDelete lanza NotFound si setActivo no devuelve el cliente', async () => {
    repository.findByIdConPerfil.mockResolvedValue(crearCliente());
    repository.setActivo.mockResolvedValue(null);

    await expect(
      service.softDelete('cliente-1', 'workspace-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('restaurar lanza Forbidden si el snapshot pertenece a otro workspace', async () => {
    repository.findByIdConPerfil.mockResolvedValue(crearCliente());
    container.guardar('cliente-1', {
      id: 'cliente-1',
      usuarioId: 'usuario-1',
      entrenadorId: 'entrenador-1',
      espacioDeTrabajoId: 'workspace-2',
      estaActivo: true,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-02T00:00:00.000Z',
    });

    await expect(
      service.restaurar('cliente-1', 'workspace-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.setActivo).not.toHaveBeenCalled();
  });

  it('update valida workspace y actualiza por repositorio', async () => {
    const cliente = crearCliente();
    repository.findByIdConPerfil.mockResolvedValue(cliente);
    repository.update.mockResolvedValue(cliente);

    await expect(
      service.update('cliente-1', { estaActivo: true }, 'workspace-1'),
    ).resolves.toBe(cliente);

    expect(repository.update).toHaveBeenCalledWith(
      'cliente-1',
      { estaActivo: true },
      'workspace-1',
    );
  });

  it('softDelete guarda snapshot y desactiva el cliente', async () => {
    const cliente = crearCliente();
    const desactivado = crearCliente({ estaActivo: false });
    repository.findByIdConPerfil.mockResolvedValue(cliente);
    repository.setActivo.mockResolvedValue(desactivado);

    await expect(service.softDelete('cliente-1', 'workspace-1')).resolves.toBe(
      desactivado,
    );

    expect(container.restaurarUltimo('cliente-1')?.getEstado()).toMatchObject({
      id: 'cliente-1',
      estaActivo: true,
      espacioDeTrabajoId: 'workspace-1',
    });
    expect(repository.setActivo).toHaveBeenCalledWith(
      'cliente-1',
      false,
      'workspace-1',
    );
  });

  it('restaurar consume el último memento y reactiva el cliente', async () => {
    const cliente = crearCliente({ estaActivo: false });
    repository.findByIdConPerfil.mockResolvedValue(cliente);
    repository.setActivo.mockResolvedValue(crearCliente({ estaActivo: true }));
    container.guardar('cliente-1', {
      id: 'cliente-1',
      usuarioId: 'usuario-1',
      entrenadorId: 'entrenador-1',
      espacioDeTrabajoId: 'workspace-1',
      estaActivo: true,
      creadoEn: '2026-01-01T00:00:00.000Z',
      actualizadoEn: '2026-01-02T00:00:00.000Z',
    });

    await service.restaurar('cliente-1', 'workspace-1');

    expect(repository.setActivo).toHaveBeenCalledWith(
      'cliente-1',
      true,
      'workspace-1',
    );
  });

  it('restaurar lanza NotFound si no hay memento', async () => {
    repository.findByIdConPerfil.mockResolvedValue(crearCliente());

    await expect(service.restaurar('cliente-1', 'workspace-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
