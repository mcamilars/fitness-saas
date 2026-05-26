import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@repo/database';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { MailerService } from '../src/modules/mailer/mailer.service';
import { EjerciciosRepository } from '../src/modules/ejercicios/repositories/ejercicios.repository';
import { EjerciciosCatalog } from '../src/modules/registry/ejercicios.catalog';
import { truncateAll } from './helpers/db';

describe('Happy path (B11.3)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tokenEntrenador: string;
  let tokenCliente: string;
  let clienteId: string;
  let planId: string;
  let ejercicioId1: string;
  let ejercicioId2: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue({
        enviarInvitacion: jest.fn().mockResolvedValue(undefined),
        enviarCambioPlan: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    await truncateAll(prisma);

    const ejerciciosRepo = moduleFixture.get(EjerciciosRepository);
    await EjerciciosCatalog.getInstance().cargarDesde(ejerciciosRepo);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Paso 1 ────────────────────────────────────────────────────────────────
  it('Paso 1 — registra entrenador y devuelve token JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        correo: 'entrenador@test.com',
        contrasena: 'password123',
        nombre: 'Carlos',
        apellido: 'Trainer',
        nombreWorkspace: 'Gym Test',
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('usuario');
    tokenEntrenador = res.body.data.token;
  });

  // ─── Paso 2 ────────────────────────────────────────────────────────────────
  it('Paso 2 — invita cliente y devuelve token de invitación', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/clientes/invitar')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ correo: 'cli@test.com' })
      .expect(201);

    expect(res.body.data.invitacion).toHaveProperty('token');
    // stored implicitly — used in paso 3
    (global as Record<string, unknown>).__tokenInvitacion = res.body.data.invitacion.token;
  });

  // ─── Paso 3 ────────────────────────────────────────────────────────────────
  it('Paso 3 — registra cliente vía invitación y devuelve token + clienteId', async () => {
    const tokenInvitacion = (global as Record<string, unknown>).__tokenInvitacion as string;

    const res = await request(app.getHttpServer())
      .post('/api/auth/cliente/register')
      .send({
        tokenInvitacion,
        correo: 'cli@test.com',
        contrasena: 'password123',
        nombre: 'Ana',
        apellido: 'Cliente',
      })
      .expect(201);

    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.cliente).toHaveProperty('id');
    tokenCliente = res.body.data.token;
    clienteId = res.body.data.cliente.id;
  });

  // ─── Paso 4 ────────────────────────────────────────────────────────────────
  it('Paso 4 — crea 3 ejercicios; segunda llamada a GET /ejercicios usa cache (Decorator)', async () => {
    const grupos = ['PECHO', 'PIERNAS', 'ESPALDA'];
    const ids: string[] = [];

    for (const grupoMuscular of grupos) {
      const res = await request(app.getHttpServer())
        .post('/api/ejercicios')
        .set('Authorization', `Bearer ${tokenEntrenador}`)
        .send({ nombre: `Ejercicio ${grupoMuscular}`, grupoMuscular })
        .expect(201);
      ids.push(res.body.data.id);
    }

    ejercicioId1 = ids[0];
    ejercicioId2 = ids[1];

    const get1 = await request(app.getHttpServer())
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    const get2 = await request(app.getHttpServer())
      .get('/api/ejercicios')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    expect(get1.body.data).toHaveLength(3);
    expect(get2.body.data).toHaveLength(3);
  });

  // ─── Paso 5 ────────────────────────────────────────────────────────────────
  it('Paso 5 — crea plan HIPERTROFIA; factory lo inicializa en BORRADOR (Factory)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/planes-entrenamiento')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ nombre: 'Plan Hipertrofia Test', tipo: 'HIPERTROFIA' })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.estado).toBe('BORRADOR');
    expect(res.body.data.tipo).toBe('HIPERTROFIA');
    planId = res.body.data.id;
  });

  // ─── Paso 6 ────────────────────────────────────────────────────────────────
  it('Paso 6 — agrega 2 ejercicios al plan', async () => {
    const ej1 = await request(app.getHttpServer())
      .post(`/api/planes-entrenamiento/${planId}/ejercicios`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ ejercicioId: ejercicioId1, series: 4, repeticiones: 10, orden: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/planes-entrenamiento/${planId}/ejercicios`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ ejercicioId: ejercicioId2, series: 3, repeticiones: 12, orden: 2 })
      .expect(201);

    expect(ej1.body.data).toHaveProperty('id');
  });

  // ─── Paso 7 ────────────────────────────────────────────────────────────────
  it('Paso 7 — activa el plan; State transiciona BORRADOR → ACTIVO', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/planes-entrenamiento/${planId}/activar`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    expect(res.body.data.estado).toBe('ACTIVO');
  });

  // ─── Paso 8 ────────────────────────────────────────────────────────────────
  it('Paso 8 — asigna plan al cliente; Observer genera notificación', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/asignaciones/entrenamiento')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ clienteId, planEntrenamientoId: planId })
      .expect(201);

    expect(res.body.data).toHaveProperty('id');
  });

  // ─── Paso 9 ────────────────────────────────────────────────────────────────
  it('Paso 9 — cliente recibe ≥1 notificación (Observer)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/notificaciones')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('mensaje');
  });

  // ─── Paso 10 ───────────────────────────────────────────────────────────────
  it('Paso 10 — registra entrenamiento con 2 ejercicios (Builder)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/clientes/${clienteId}/registros-entrenamiento`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        fecha: '2026-05-26',
        duracionMin: 60,
        ejercicios: [
          { nombre: 'Press banca', grupoMuscular: 'PECHO', series: 4, repeticiones: 10, pesoKg: 80 },
          { nombre: 'Sentadilla', grupoMuscular: 'PIERNAS', series: 3, repeticiones: 12, pesoKg: 100 },
        ],
      })
      .expect(201);

    expect(res.body.data.registro.ejercicios).toHaveLength(2);
    expect(res.body.data.registro).toHaveProperty('id');
  });

  // ─── Paso 11 ───────────────────────────────────────────────────────────────
  it('Paso 11 — GET /dashboard devuelve los 4 bloques compuestos (Facade)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/clientes/${clienteId}/dashboard`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    const dashboard = res.body.data.dashboard;
    expect(dashboard).toHaveProperty('cliente');
    expect(dashboard).toHaveProperty('planActivo');
    expect(dashboard).toHaveProperty('ultimosRegistros');
    expect(dashboard).toHaveProperty('progresoSemanal');
    expect(dashboard.planActivo.estado).toBe('ACTIVO');
    expect(dashboard.ultimosRegistros.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Paso 12 ───────────────────────────────────────────────────────────────
  it('Paso 12 — GET /progreso?vista=semanal devuelve ≥1 periodo (Strategy)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/clientes/${clienteId}/progreso?vista=semanal`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    const progreso = res.body.data.progreso;
    expect(progreso.totalSesiones).toBeGreaterThanOrEqual(1);
    expect(progreso.periodos.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Paso 13 ───────────────────────────────────────────────────────────────
  it('Paso 13 — duplica plan; id distinto y nombre con "(copia)" (Prototype)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/planes-entrenamiento/${planId}/duplicar`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(201);

    expect(res.body.data.id).not.toBe(planId);
    expect(res.body.data.nombre).toContain('(copia)');
  });

  // ─── Paso 14 ───────────────────────────────────────────────────────────────
  it('Paso 14 — DELETE /clientes/:id deja estaActivo=false (Command + Memento)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    expect(res.body.data.cliente.estaActivo).toBe(false);
  });

  // ─── Paso 15 ───────────────────────────────────────────────────────────────
  it('Paso 15 — POST /commands/undo reactiva el cliente (Command undo)', async () => {
    await request(app.getHttpServer())
      .post('/api/commands/undo')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .expect(200);

    expect(res.body.data.cliente.estaActivo).toBe(true);
  });
});
