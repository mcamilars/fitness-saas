export interface EventoPlan {
  tipo: 'PLAN_ACTIVADO' | 'PLAN_MODIFICADO' | 'PLAN_ARCHIVADO';
  planId: string;
  clienteId?: string;
}

export interface Observer {
  update(evento: EventoPlan): void | Promise<void>;
}

export interface Subject {
  subscribe(planId: string, observer: Observer): void;
  unsubscribe(planId: string, observer: Observer): void;
  notify(planId: string, evento: EventoPlan): void | Promise<void>;
}
