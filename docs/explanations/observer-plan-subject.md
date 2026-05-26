# Patrón Observer — PlanSubject

El patrón **Observer** define una relación de uno a muchos: cuando un objeto (el sujeto) cambia de estado, notifica automáticamente a todos los objetos suscritos (los observers), sin saber quiénes son ni cuántos hay.

En este backend, cuando el estado de un plan de entrenamiento cambia (`PLAN_ACTIVADO`, `PLAN_MODIFICADO`, `PLAN_ARCHIVADO`), todos los clientes asignados a ese plan deben recibir una notificación in-app y un email. El sujeto (`PlanSubject`) no sabe cómo se notifica; cada observer sabe qué hacer con el evento.

## Partes implementadas

### 1. Interfaces `Observer` y `Subject`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/observers/subject.interface.ts
```

```ts
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
```

`EventoPlan` es el dato que viaja del sujeto a los observers. Cada observer solo recibe ese objeto y decide qué hacer con él.

### 2. `PlanSubject`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/observers/plan-subject.service.ts
```

Es el sujeto concreto. Mantiene un mapa `planId → Set<Observer>` para poder tener listas independientes de observers por plan:

```ts
@Injectable()
export class PlanSubject implements Subject {
  private readonly observersPorPlan = new Map<string, Set<Observer>>();

  subscribe(planId: string, observer: Observer): void {
    const observers = this.observersPorPlan.get(planId) ?? new Set<Observer>();
    observers.add(observer);
    this.observersPorPlan.set(planId, observers);
  }

  unsubscribe(planId: string, observer: Observer): void { ... }

  async notify(planId: string, evento: EventoPlan): Promise<void> {
    const observers = this.observersPorPlan.get(planId);
    await Promise.all(Array.from(observers).map((o) => o.update(evento)));
  }
}
```

`PlanSubject` no sabe ni le importa si hay un observer, diez, o ninguno. Solo itera el `Set` y llama `update`.

### 3. `ClienteObserver`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/observers/cliente.observer.ts
```

Observer concreto que persiste una notificación in-app cuando recibe un evento:

```ts
export class ClienteObserver implements Observer {
  constructor(
    private readonly notificacionesRepository: NotificacionesRepository,
    private readonly clienteId: string,
  ) {}

  async update(evento: EventoPlan): Promise<void> {
    await this.notificacionesRepository.crear({
      clienteId: evento.clienteId ?? this.clienteId,
      mensaje: this.crearMensaje(evento),
    });
  }
}
```

No importa `PrismaService`; delega la persistencia en `NotificacionesRepository`.

### 4. `EmailNotificationObserver`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/observers/email-notification.observer.ts
```

Observer concreto que envía un email cuando recibe un evento:

```ts
export class EmailNotificationObserver implements Observer {
  constructor(
    private readonly mailer: MailerService,
    private readonly correoCliente: string,
  ) {}

  async update(evento: EventoPlan): Promise<void> {
    await this.mailer.enviarCambioPlan(this.correoCliente, this.crearMensaje(evento));
  }
}
```

Ambos observers reciben sus dependencias en el constructor, no a través de DI de NestJS, porque se instancian manualmente en tiempo de ejecución (un observer por cliente asignado).

## Dónde se suscriben los observers

La suscripción ocurre en `AsignacionesService.asignarEntrenamiento()`, justo después de crear la asignación en base de datos:

```ts
// asignaciones.service.ts
const asignacion = await this.asignacionesRepository.crear({ ... });

this.planSubject.subscribe(
  plan.id,
  new ClienteObserver(this.notificacionesRepository, cliente.id),
);
this.planSubject.subscribe(
  plan.id,
  new EmailNotificationObserver(this.mailer, cliente.usuario.correo),
);
```

Cada vez que se asigna un cliente a un plan, se registran dos observers para ese plan: uno que escribe en la BD y otro que envía email.

## Dónde se disparan las notificaciones

Desde `PlanesEntrenamientoService`, cuando el estado del plan cambia:

- `activar()` → `BorradorState.activar()` llama `ctx.subject.notify(planId, { tipo: 'PLAN_ACTIVADO' })`.
- `archivar()` → `ActivoState.archivar()` llama `ctx.subject.notify(planId, { tipo: 'PLAN_ARCHIVADO' })`.
- `agregarEjercicio()` / `quitarEjercicio()` con plan ACTIVO → llama `planSubject.notify(planId, { tipo: 'PLAN_MODIFICADO' })`.

El servicio de planes no sabe cuántos clientes están asignados ni cómo se notifican; solo llama `notify`.

## Para qué sirve en este proyecto

Sin Observer, `PlanesEntrenamientoService` tendría que conocer `NotificacionesRepository` y `MailerService` y llamarlos directamente al cambiar el estado:

```ts
// sin el patrón
await this.notificacionesRepository.crear({ ... });
await this.mailer.enviarCambioPlan(...);
```

Eso acopla el módulo de planes al de notificaciones y al mailer. Con Observer, el servicio de planes solo conoce `PlanSubject`; agregar un tercer canal de notificación (push, Slack, etc.) solo requiere crear un nuevo observer y suscribirlo, sin tocar el servicio de planes.

## Flujo

Cuando se llama:

```http
PATCH /api/planes-entrenamiento/:id/activar
```

y hay clientes asignados a ese plan:

```txt
PlanesEntrenamientoService.activar()
  └── BorradorState.activar(plan, ctx)
        └── ctx.repository.updateEstado('ACTIVO')
        └── ctx.subject.notify(planId, { tipo: 'PLAN_ACTIVADO' })
              └── PlanSubject.notify()
                    ├── ClienteObserver.update(evento)
                    │     └── NotificacionesRepository.crear({ mensaje: 'Tu plan fue activado.' })
                    └── EmailNotificationObserver.update(evento)
                          └── MailerService.enviarCambioPlan(correo, 'Tu plan fue activado.')
```

Cuando se llama:

```http
POST /api/asignaciones/entrenamiento
```

```txt
AsignacionesService.asignarEntrenamiento()
  └── validaciones (cliente existe, plan ACTIVO, mismo workspace)
  └── AsignacionesEntrenamientoRepository.crear()
  └── PlanSubject.subscribe(planId, new ClienteObserver(...))
  └── PlanSubject.subscribe(planId, new EmailNotificationObserver(...))
```
