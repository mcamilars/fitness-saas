import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController validation', () => {
  let app: INestApplication;

  const authService = {
    registrarEntrenador: jest.fn(),
    login: jest.fn(),
    registrarCliente: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna 400 cuando el registro de entrenador recibe un payload inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        correo: 'correo-invalido',
        contrasena: 'corta',
        nombreWorkspace: 'A',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(response.body.mensaje).toEqual(
      expect.arrayContaining([
        'correo must be an email',
        'contrasena must be longer than or equal to 8 characters',
        'nombre must be a string',
        'apellido must be a string',
        'nombreWorkspace must be longer than or equal to 2 characters',
      ]),
    );
    expect(authService.registrarEntrenador).not.toHaveBeenCalled();
  });

  it('acepta un registro de entrenador válido y remueve campos extra', async () => {
    authService.registrarEntrenador.mockResolvedValue({
      token: 'jwt-entrenador',
      usuario: {
        id: 'usuario-1',
        correo: 'coach@example.com',
        nombre: 'Ana',
        apellido: 'Coach',
        rol: 'ENTRENADOR',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        correo: 'coach@example.com',
        contrasena: 'password123',
        nombre: 'Ana',
        apellido: 'Coach',
        nombreWorkspace: 'Fuerza Total',
        rol: 'ADMIN',
      })
      .expect(201);

    expect(authService.registrarEntrenador).toHaveBeenCalledWith({
      correo: 'coach@example.com',
      contrasena: 'password123',
      nombre: 'Ana',
      apellido: 'Coach',
      nombreWorkspace: 'Fuerza Total',
    });
    expect(response.body).toEqual({
      data: {
        token: 'jwt-entrenador',
        usuario: {
          id: 'usuario-1',
          correo: 'coach@example.com',
          nombre: 'Ana',
          apellido: 'Coach',
          rol: 'ENTRENADOR',
        },
      },
    });
  });

  it('retorna 400 cuando login recibe un payload inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: 'correo-invalido', contrasena: 'corta' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(response.body.mensaje).toEqual(
      expect.arrayContaining([
        'correo must be an email',
        'contrasena must be longer than or equal to 8 characters',
      ]),
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('acepta un login válido y remueve campos extra', async () => {
    authService.login.mockResolvedValue({
      token: 'jwt-login',
      usuario: {
        id: 'usuario-2',
        correo: 'cliente@example.com',
        nombre: 'Luis',
        apellido: 'Cliente',
        rol: 'CLIENTE',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'cliente@example.com',
        contrasena: 'password123',
        workspaceId: 'workspace-forzado',
      })
      .expect(200);

    expect(authService.login).toHaveBeenCalledWith({
      correo: 'cliente@example.com',
      contrasena: 'password123',
    });
    expect(response.body).toEqual({
      data: {
        token: 'jwt-login',
        usuario: {
          id: 'usuario-2',
          correo: 'cliente@example.com',
          nombre: 'Luis',
          apellido: 'Cliente',
          rol: 'CLIENTE',
        },
      },
    });
  });

  it('retorna 400 cuando el registro de cliente recibe un payload inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/cliente/register')
      .send({
        tokenInvitacion: '',
        correo: 'correo-invalido',
        contrasena: 'corta',
        nombre: '',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(response.body.mensaje).toEqual(
      expect.arrayContaining([
        'tokenInvitacion must be longer than or equal to 1 characters',
        'correo must be an email',
        'contrasena must be longer than or equal to 8 characters',
        'nombre must be longer than or equal to 1 characters',
        'apellido must be a string',
      ]),
    );
    expect(authService.registrarCliente).not.toHaveBeenCalled();
  });

  it('acepta un registro de cliente válido y remueve campos extra', async () => {
    authService.registrarCliente.mockResolvedValue({
      token: 'jwt-cliente',
      cliente: {
        id: 'cliente-1',
        usuarioId: 'usuario-3',
        entrenadorId: 'entrenador-1',
        espacioDeTrabajoId: 'workspace-1',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/cliente/register')
      .send({
        tokenInvitacion: 'token-valido',
        correo: 'nuevo@example.com',
        contrasena: 'password123',
        nombre: 'Nuevo',
        apellido: 'Cliente',
        consumida: true,
      })
      .expect(201);

    expect(authService.registrarCliente).toHaveBeenCalledWith({
      tokenInvitacion: 'token-valido',
      correo: 'nuevo@example.com',
      contrasena: 'password123',
      nombre: 'Nuevo',
      apellido: 'Cliente',
    });
    expect(response.body).toEqual({
      data: {
        token: 'jwt-cliente',
        cliente: {
          id: 'cliente-1',
          usuarioId: 'usuario-3',
          entrenadorId: 'entrenador-1',
          espacioDeTrabajoId: 'workspace-1',
        },
      },
    });
  });
});
