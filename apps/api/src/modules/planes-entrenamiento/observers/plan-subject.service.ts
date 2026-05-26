import { Injectable } from '@nestjs/common';
import type { EventoPlan, Observer, Subject } from './subject.interface';

@Injectable()
export class PlanSubject implements Subject {
  private readonly observersPorPlan = new Map<string, Set<Observer>>();

  subscribe(planId: string, observer: Observer): void {
    const observers = this.observersPorPlan.get(planId) ?? new Set<Observer>();
    observers.add(observer);
    this.observersPorPlan.set(planId, observers);
  }

  unsubscribe(planId: string, observer: Observer): void {
    const observers = this.observersPorPlan.get(planId);

    if (!observers) {
      return;
    }

    observers.delete(observer);

    if (observers.size === 0) {
      this.observersPorPlan.delete(planId);
    }
  }

  async notify(planId: string, evento: EventoPlan): Promise<void> {
    const observers = this.observersPorPlan.get(planId);

    if (!observers) {
      return;
    }

    await Promise.all(
      Array.from(observers).map(async (observer) => observer.update(evento)),
    );
  }
}
