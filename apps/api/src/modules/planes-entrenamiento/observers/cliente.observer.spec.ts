import { ClienteObserver } from './cliente.observer';

describe('ClienteObserver', () => {
  const notificacionesRepository = {
    crear: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('persiste notificación con mensaje según evento', async () => {
    const observer = new ClienteObserver(
      notificacionesRepository as never,
      'cliente-1',
    );

    await observer.update({
      tipo: 'PLAN_MODIFICADO',
      planId: 'plan-1',
    });

    expect(notificacionesRepository.crear).toHaveBeenCalledWith({
      clienteId: 'cliente-1',
      mensaje: 'Tu plan de entrenamiento fue modificado.',
    });
  });

  it('usa clienteId del evento cuando está presente', async () => {
    const observer = new ClienteObserver(
      notificacionesRepository as never,
      'cliente-default',
    );

    await observer.update({
      tipo: 'PLAN_ACTIVADO',
      planId: 'plan-1',
      clienteId: 'cliente-evento',
    });

    expect(notificacionesRepository.crear).toHaveBeenCalledWith({
      clienteId: 'cliente-evento',
      mensaje: 'Tu plan de entrenamiento fue activado.',
    });
  });
});
