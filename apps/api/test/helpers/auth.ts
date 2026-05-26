import { type INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export async function registrarEntrenadorYLogin(
  app: INestApplication,
  correo = 'entrenador@test.com',
): Promise<{ token: string }> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      correo,
      contrasena: 'password123',
      nombre: 'Carlos',
      apellido: 'Trainer',
      nombreWorkspace: 'Gym Test',
    })
    .expect(201);

  return { token: res.body.data.token };
}

export async function crearClientePorInvitacion(
  app: INestApplication,
  tokenEntrenador: string,
  correo = 'cliente@test.com',
): Promise<{ token: string; clienteId: string }> {
  const invRes = await request(app.getHttpServer())
    .post('/api/clientes/invitar')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ correo })
    .expect(201);

  const tokenInvitacion: string = invRes.body.data.invitacion.token;

  const regRes = await request(app.getHttpServer())
    .post('/api/auth/cliente/register')
    .send({
      tokenInvitacion,
      correo,
      contrasena: 'password123',
      nombre: 'Ana',
      apellido: 'Cliente',
    })
    .expect(201);

  return {
    token: regRes.body.data.token,
    clienteId: regRes.body.data.cliente.id,
  };
}
