import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Rol } from '@repo/database';
import * as bcrypt from 'bcryptjs';
import {
  AuthService,
  type LoginInput,
  type RegistrarClienteInput,
  type RegistrarEntrenadorInput,
} from './auth.service';

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

describe('AuthService.registrarEntrenador', () => {
  const input: RegistrarEntrenadorInput = {
    correo: 'coach@test.com',
    contrasena: 'secreta123',
    nombre: 'Ana',
    apellido: 'Coach',
    nombreWorkspace: 'Fuerza Total',
  };

  const construir = () => {
    const nuevoUsuario = {
      id: 'usuario-1',
      correo: input.correo,
      rol: Rol.ENTRENADOR,
      nombre: input.nombre,
      apellido: input.apellido,
      contrasenaHash: 'hash',
    };

    const usuariosRepository = {
      findByCorreo: jest.fn().mockResolvedValue(null),
      crear: jest.fn().mockResolvedValue(nuevoUsuario),
      conTransaccion: jest.fn((cb: (tx: unknown) => unknown) => cb({})),
    };
    const espaciosDeTrabajoRepository = {
      findBySlug: jest.fn().mockResolvedValue(null),
      crear: jest.fn().mockResolvedValue({ id: 'workspace-1', slug: 'fuerza-total' }),
    };
    const entrenadoresRepository = {
      crear: jest.fn().mockResolvedValue({ id: 'entrenador-1' }),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-entrenador'),
    };

    const service = new AuthService(
      usuariosRepository as never,
      entrenadoresRepository as never,
      espaciosDeTrabajoRepository as never,
      {} as never,
      {} as never,
      jwtService as never,
    );

    return {
      service,
      usuariosRepository,
      espaciosDeTrabajoRepository,
      entrenadoresRepository,
      jwtService,
    };
  };

  beforeEach(() => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
  });

  it('lanza ConflictException cuando el correo ya está registrado', async () => {
    const { service, usuariosRepository } = construir();
    usuariosRepository.findByCorreo.mockResolvedValue({ id: 'existente' });

    await expect(service.registrarEntrenador(input)).rejects.toThrow(
      ConflictException,
    );
    expect(usuariosRepository.conTransaccion).not.toHaveBeenCalled();
  });

  it('genera un slug único cuando el slug base ya existe', async () => {
    const { service, espaciosDeTrabajoRepository } = construir();
    espaciosDeTrabajoRepository.findBySlug
      .mockResolvedValueOnce({ id: 'otro', slug: 'fuerza-total' })
      .mockResolvedValueOnce({ id: 'otro-2', slug: 'fuerza-total-2' })
      .mockResolvedValueOnce(null);

    await service.registrarEntrenador(input);

    expect(espaciosDeTrabajoRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'fuerza-total-3' }),
      expect.anything(),
    );
  });

  it('lanza ConflictException cuando el nombre no produce un slug válido', async () => {
    const { service } = construir();

    await expect(
      service.registrarEntrenador({ ...input, nombreWorkspace: '###' }),
    ).rejects.toThrow(ConflictException);
  });

  it('crea usuario, workspace y entrenador en transacción y devuelve token', async () => {
    const { service, usuariosRepository, entrenadoresRepository, jwtService } =
      construir();

    const resultado = await service.registrarEntrenador(input);

    expect(usuariosRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ correo: input.correo, rol: Rol.ENTRENADOR }),
      expect.anything(),
    );
    expect(entrenadoresRepository.crear).toHaveBeenCalled();
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ rol: Rol.ENTRENADOR, workspaceId: 'workspace-1' }),
    );
    expect(resultado.token).toBe('jwt-entrenador');
    expect(resultado.usuario).not.toHaveProperty('contrasenaHash');
  });
});

describe('AuthService.login', () => {
  const input: LoginInput = {
    correo: 'usuario@test.com',
    contrasena: 'secreta123',
  };

  const crearUsuario = (rol: Rol) => ({
    id: 'usuario-1',
    correo: input.correo,
    contrasenaHash: 'hash',
    nombre: 'Test',
    apellido: 'User',
    rol,
    estaActivo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  });

  const construir = (usuario: ReturnType<typeof crearUsuario> | null) => {
    const usuariosRepository = {
      findByCorreo: jest.fn().mockResolvedValue(usuario),
    };
    const entrenadoresRepository = {
      findByUsuarioId: jest
        .fn()
        .mockResolvedValue({ id: 'entrenador-1', espacioDeTrabajoId: 'workspace-1' }),
    };
    const clientesRepository = {
      findByUsuarioId: jest
        .fn()
        .mockResolvedValue({ id: 'cliente-1', espacioDeTrabajoId: 'workspace-2' }),
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-login') };

    const service = new AuthService(
      usuariosRepository as never,
      entrenadoresRepository as never,
      {} as never,
      clientesRepository as never,
      {} as never,
      jwtService as never,
    );

    return {
      service,
      usuariosRepository,
      entrenadoresRepository,
      clientesRepository,
      jwtService,
    };
  };

  it('lanza UnauthorizedException cuando el correo no existe', async () => {
    const { service } = construir(null);

    await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
  });

  it('lanza UnauthorizedException cuando la contraseña es incorrecta', async () => {
    const { service } = construir(crearUsuario(Rol.ENTRENADOR));
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
  });

  it('resuelve el workspace del entrenador y firma el token', async () => {
    const { service, entrenadoresRepository, jwtService } = construir(
      crearUsuario(Rol.ENTRENADOR),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const resultado = await service.login(input);

    expect(entrenadoresRepository.findByUsuarioId).toHaveBeenCalledWith('usuario-1');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'workspace-1', rol: Rol.ENTRENADOR }),
    );
    expect(resultado.usuario).not.toHaveProperty('contrasenaHash');
  });

  it('resuelve el workspace del cliente y firma el token', async () => {
    const { service, clientesRepository, jwtService } = construir(
      crearUsuario(Rol.CLIENTE),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await service.login(input);

    expect(clientesRepository.findByUsuarioId).toHaveBeenCalledWith('usuario-1');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'workspace-2', rol: Rol.CLIENTE }),
    );
  });

  it('lanza UnauthorizedException cuando el entrenador no tiene workspace', async () => {
    const { service, entrenadoresRepository } = construir(
      crearUsuario(Rol.ENTRENADOR),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    entrenadoresRepository.findByUsuarioId.mockResolvedValue(null);

    await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
  });

  it('lanza UnauthorizedException cuando el cliente no tiene workspace', async () => {
    const { service, clientesRepository } = construir(crearUsuario(Rol.CLIENTE));
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    clientesRepository.findByUsuarioId.mockResolvedValue(null);

    await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
  });
});
