import { PlanSubject } from './plan-subject.service';

describe('PlanSubject', () => {
  let subject: PlanSubject;

  beforeEach(() => {
    subject = new PlanSubject();
  });

  it('subscribe y notify llaman a observers del plan correcto', async () => {
    const observerPlan1 = { update: jest.fn() };
    const observerPlan2 = { update: jest.fn() };

    subject.subscribe('plan-1', observerPlan1);
    subject.subscribe('plan-2', observerPlan2);

    await subject.notify('plan-1', {
      tipo: 'PLAN_ACTIVADO',
      planId: 'plan-1',
    });

    expect(observerPlan1.update).toHaveBeenCalledWith({
      tipo: 'PLAN_ACTIVADO',
      planId: 'plan-1',
    });
    expect(observerPlan2.update).not.toHaveBeenCalled();
  });

  it('unsubscribe evita que el observer reciba eventos futuros', async () => {
    const observer = { update: jest.fn() };

    subject.subscribe('plan-1', observer);
    subject.unsubscribe('plan-1', observer);

    await subject.notify('plan-1', {
      tipo: 'PLAN_ARCHIVADO',
      planId: 'plan-1',
    });

    expect(observer.update).not.toHaveBeenCalled();
  });

  it('notify espera observers async', async () => {
    const observer = { update: jest.fn().mockResolvedValue(undefined) };

    subject.subscribe('plan-1', observer);

    await subject.notify('plan-1', {
      tipo: 'PLAN_MODIFICADO',
      planId: 'plan-1',
      clienteId: 'cliente-1',
    });

    expect(observer.update).toHaveBeenCalledWith({
      tipo: 'PLAN_MODIFICADO',
      planId: 'plan-1',
      clienteId: 'cliente-1',
    });
  });
});
