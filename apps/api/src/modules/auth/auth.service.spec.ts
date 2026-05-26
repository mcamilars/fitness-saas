import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import { AuthService, type RegistrarClienteInput } from './auth.service';

jest.mock('bcryptjs');

describe('AuthService.registrarCliente (validación de invitación)', () => {
  const workspaceId = 'workspace-1';
  const correo = 'cliente@test.com';

  const input: RegistrarClienteInput = {
    tokenInvitacion: 'token-valido',
    correo,
    contrasena: 'secreta123',
    nombre: 'Ada',
    apellido: 'Lovelace',
  };

  const crearInvitacion = (overrides = {}) => ({
    id: 'invitacion-1',
    espacioDeTrabajoId: workspaceId,
    correo,
    token: 'token-valido',
    expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
    consumida: false,
    creadoEn: new Date(),
    ...overrides,
  });

  interface Mocks {
    usuariosRepository: {
      findByCorreo: jest.Mock;
      crear: jest.Mock;
      conTransaccion: jest.Mock;
    };
    entrenadoresRepository: { findByEspacioDeTrabajoId: jest.Mock };
    clientesRepository: { crear: jest.Mock };
    invitacionesRepository: {
      findByToken: jest.Mock;
      marcarConsumida: jest.Mock;
    };
    jwtService: { signAsync: jest.Mock };
  }

  const construir = (
    invitacion: ReturnType<typeof crearInvitacion> | null,
  ): { service: AuthService; mocks: Mocks } => {
    const nuevoUsuario = {
      id: 'usuario-1',
      correo,
      rol: Rol.CLIENTE,
      nombre: 'Ada',
      apellido: 'Lovelace',
      contrasenaHash: 'hash',
    };
    const nuevoCliente = { id: 'cliente-1', espacioDeTrabajoId: workspaceId };

    const usuariosRepository = {
      findByCorreo: jest.fn().mockResolvedValue(null),
      crear: jest.fn().mockResolvedValue(nuevoUsuario),
      conTransaccion: jest.fn((cb: (tx: unknown) => unknown) => cb({})),
    };
    const entrenadoresRepository = {
      findByEspacioDeTrabajoId: jest
        .fn()
        .mockResolvedValue({ id: 'entrenador-1', espacioDeTrabajoId: workspaceId }),
    };
    const clientesRepository = {
      crear: jest.fn().mockResolvedValue(nuevoCliente),
    };
    const invitacionesRepository = {
      findByToken: jest.fn().mockResolvedValue(invitacion),
      marcarConsumida: jest.fn().mockResolvedValue(invitacion),
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-cliente') };

    const service = new AuthService(
      usuariosRepository as never,
      entrenadoresRepository as never,
      {} as never,
      clientesRepository as never,
      invitacionesRepository as never,
      jwtService as never,
    );

    return {
      service,
      mocks: {
        usuariosRepository,
        entrenadoresRepository,
        clientesRepository,
        invitacionesRepository,
        jwtService,
      },
    };
  };

  beforeEach(() => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
  });

  it('lanza NotFoundException cuando la invitación no existe', async () => {
    const { service, mocks } = construir(null);

    await expect(service.registrarCliente(input)).rejects.toThrow(
      NotFoundException,
    );
    expect(mocks.invitacionesRepository.findByToken).toHaveBeenCalledWith(
      input.tokenInvitacion,
    );
    expect(mocks.usuariosRepository.conTransaccion).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException cuando la invitación ya fue consumida', async () => {
    const { service } = construir(crearInvitacion({ consumida: true }));

    await expect(service.registrarCliente(input)).rejects.toThrow(
      new BadRequestException('La invitación ya fue consumida'),
    );
  });

  it('lanza BadRequestException cuando la invitación ha expirado', async () => {
    const { service } = construir(
      crearInvitacion({ expiraEn: new Date(Date.now() - 1000) }),
    );

    await expect(service.registrarCliente(input)).rejects.toThrow(
      new BadRequestException('La invitación ha expirado'),
    );
  });

  it('lanza BadRequestException cuando el correo no coincide con la invitación', async () => {
    const { service } = construir(crearInvitacion({ correo: 'otro@test.com' }));

    await expect(service.registrarCliente(input)).rejects.toThrow(
      new BadRequestException('El correo no coincide con la invitación'),
    );
  });

  it('lanza ConflictException cuando el correo ya está registrado', async () => {
    const { service, mocks } = construir(crearInvitacion());
    mocks.usuariosRepository.findByCorreo.mockResolvedValue({ id: 'existente' });

    await expect(service.registrarCliente(input)).rejects.toThrow(
      ConflictException,
    );
    expect(mocks.usuariosRepository.conTransaccion).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException cuando el workspace no tiene entrenador asociado', async () => {
    const { service, mocks } = construir(crearInvitacion());
    mocks.entrenadoresRepository.findByEspacioDeTrabajoId.mockResolvedValue(null);

    await expect(service.registrarCliente(input)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('registra al cliente, marca la invitación consumida y devuelve token', async () => {
    const invitacion = crearInvitacion();
    const { service, mocks } = construir(invitacion);

    const resultado = await service.registrarCliente(input);

    expect(mocks.usuariosRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ correo, rol: Rol.CLIENTE }),
      expect.anything(),
    );
    expect(mocks.clientesRepository.crear).toHaveBeenCalled();
    expect(mocks.invitacionesRepository.marcarConsumida).toHaveBeenCalledWith(
      invitacion.token,
      expect.anything(),
    );
    expect(mocks.jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        rol: Rol.CLIENTE,
        workspaceId: invitacion.espacioDeTrabajoId,
      }),
    );
    expect(resultado).toEqual({
      token: 'jwt-cliente',
      cliente: { id: 'cliente-1', espacioDeTrabajoId: workspaceId },
    });
  });
});
