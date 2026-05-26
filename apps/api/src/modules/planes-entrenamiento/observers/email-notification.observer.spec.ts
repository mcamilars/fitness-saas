import { EmailNotificationObserver } from './email-notification.observer';

describe('EmailNotificationObserver', () => {
  const mailer = {
    enviarCambioPlan: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('invoca mailer con el template de cambio de plan', async () => {
    const observer = new EmailNotificationObserver(
      mailer as never,
      'cliente@test.com',
    );

    await observer.update({
      tipo: 'PLAN_ARCHIVADO',
      planId: 'plan-1',
    });

    expect(mailer.enviarCambioPlan).toHaveBeenCalledWith(
      'cliente@test.com',
      'Tu plan de entrenamiento fue archivado.',
    );
  });
});
