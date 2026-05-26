import { InvitacionesController } from './invitaciones.controller';

describe('InvitacionesController.verificar', () => {
  const crearInvitacion = (overrides = {}) => ({
    id: 'invitacion-1',
    espacioDeTrabajoId: 'workspace-1',
    correo: 'cliente@test.com',
    token: 'token-valido',
    expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
    consumida: false,
    creadoEn: new Date(),
    ...overrides,
  });

  const construir = (invitacion: ReturnType<typeof crearInvitacion> | null) => {
    const invitacionesRepository = {
      findByToken: jest.fn().mockResolvedValue(invitacion),
    };
    const controller = new InvitacionesController(
      invitacionesRepository as never,
    );
    return { controller, invitacionesRepository };
  };

  it('retorna valida:false e invitacion:null cuando el token no existe', async () => {
    const { controller, invitacionesRepository } = construir(null);

    const resultado = await controller.verificar('token-inexistente');

    expect(invitacionesRepository.findByToken).toHaveBeenCalledWith(
      'token-inexistente',
    );
    expect(resultado).toEqual({ valida: false, invitacion: null });
  });

  it('retorna valida:false cuando la invitación ya fue consumida', async () => {
    const { controller } = construir(crearInvitacion({ consumida: true }));

    const resultado = await controller.verificar('token-valido');

    expect(resultado.valida).toBe(false);
    expect(resultado.invitacion).toMatchObject({ consumida: true });
  });

  it('retorna valida:false cuando la invitación ha expirado', async () => {
    const { controller } = construir(
      crearInvitacion({ expiraEn: new Date(Date.now() - 1000) }),
    );

    const resultado = await controller.verificar('token-valido');

    expect(resultado.valida).toBe(false);
  });

  it('retorna valida:true y los datos de la invitación cuando es válida', async () => {
    const invitacion = crearInvitacion();
    const { controller } = construir(invitacion);

    const resultado = await controller.verificar('token-valido');

    expect(resultado.valida).toBe(true);
    expect(resultado.invitacion).toEqual({
      id: invitacion.id,
      correo: invitacion.correo,
      espacioDeTrabajoId: invitacion.espacioDeTrabajoId,
      expiraEn: invitacion.expiraEn,
      consumida: invitacion.consumida,
    });
  });
});
