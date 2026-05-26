import { Injectable } from '@nestjs/common';

export interface EventoPlan {
  tipo: 'PLAN_ACTIVADO' | 'PLAN_MODIFICADO' | 'PLAN_ARCHIVADO';
  planId: string;
}

@Injectable()
export class PlanSubject {
  notify(_planId: string, _evento: EventoPlan): void {
    // B7 implementa la suscripción y notificación real de observers.
  }
}
