# Resumen de Patrones de Diseño — Backend (NestJS)

El backend implementa 11 patrones GoF organizados por fase del MVP. Cada patrón tiene código concreto y un reflejo visible en el frontend.

---

## 1. Singleton

**Propósito:** Instancia única con búsqueda O(1) en memoria, deliberadamente fuera del contenedor DI de NestJS — el patrón debe ser visible en código, no oculto.

### Implementación

```typescript
// modules/registry/workspace.registry.ts
export interface WorkspaceRegistrado {
  id: string;
  slug: string;
  nombre: string;
}

export class WorkspaceRegistry {
  private static instance: WorkspaceRegistry | null = null;
  private readonly workspaces = new Map<string, WorkspaceRegistrado>();

  private constructor() {
    // Impide instancias externas; usar WorkspaceRegistry.getInstance().
  }

  static getInstance(): WorkspaceRegistry {
    WorkspaceRegistry.instance ??= new WorkspaceRegistry();
    return WorkspaceRegistry.instance;
  }

  registrar(workspace: WorkspaceRegistrado): void {
    this.workspaces.set(workspace.id, { ...workspace });
  }

  buscar(id: string): WorkspaceRegistrado | undefined {
    const workspace = this.workspaces.get(id);
    return workspace ? { ...workspace } : undefined;
  }

  listar(): WorkspaceRegistrado[] {
    return Array.from(this.workspaces.values(), (workspace) => ({ ...workspace }));
  }
}
```

```typescript
// modules/registry/ejercicios.catalog.ts
import { type Ejercicio, type GrupoMuscular } from '@repo/database';

export interface EjerciciosCatalogSource {
  findAll(): Promise<Ejercicio[]>;
}

export class EjerciciosCatalog {
  private static instance: EjerciciosCatalog | null = null;
  private readonly ejercicios = new Map<string, Ejercicio>();

  private constructor() {}

  static getInstance(): EjerciciosCatalog {
    EjerciciosCatalog.instance ??= new EjerciciosCatalog();
    return EjerciciosCatalog.instance;
  }

  async cargarDesde(ejerciciosRepository: EjerciciosCatalogSource): Promise<void> {
    const ejercicios = await ejerciciosRepository.findAll();
    this.ejercicios.clear();
    for (const ejercicio of ejercicios) {
      this.ejercicios.set(ejercicio.id, { ...ejercicio });
    }
  }

  buscarPorGrupo(grupo: GrupoMuscular): Ejercicio[] {
    return Array.from(this.ejercicios.values())
      .filter((ejercicio) => ejercicio.grupoMuscular === grupo)
      .map((ejercicio) => ({ ...ejercicio }));
  }

  obtenerTodos(): Ejercicio[] {
    return Array.from(this.ejercicios.values(), (ejercicio) => ({ ...ejercicio }));
  }
}
```

### Cómo funciona

- `WorkspaceRegistry` se consulta en `WorkspaceGuard` apenas se extrae `workspaceId` del JWT. Si el workspace ya está en memoria, el guard evita una consulta a la DB; si no, hace fallback al repositorio y registra el workspace encontrado.
- `EjerciciosCatalog` se carga en `main.ts` via `bootstrap()` antes de `app.listen()`, consumiendo `EjerciciosRepository.findAll()` sin conocer Prisma.
- Devuelven copias shallow (`{ ...entidad }`) para que ningún caller mute el estado interno del singleton.

### Reflejo en el frontend

El frontend no interactúa con estos singletons directamente — son infraestructura del backend. El `WorkspaceGuard` responde 403 si el `workspaceId` del JWT no existe ni en el registry ni en la DB, lo que para el frontend se manifiesta como un redirect a `/login` cuando la sesión expira o el workspace es inválido.

---

## 2. Decorator

**Propósito:** Añadir cache en memoria envolviendo el servicio base, sin modificarlo. Transparente para el controller.

### Implementación

```typescript
// modules/ejercicios/decorators/base.decorator.ts
import type { Ejercicio, GrupoMuscular } from '@repo/database';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import type { EjerciciosServiceInterface } from '../interfaces/ejercicios-service.interface';

export abstract class BaseDecorator implements EjerciciosServiceInterface {
  constructor(protected readonly service: EjerciciosServiceInterface) {}

  findAll(): Promise<Ejercicio[]> { return this.service.findAll(); }
  findById(id: string): Promise<Ejercicio | null> { return this.service.findById(id); }
  findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]> { return this.service.findByGrupo(grupo); }
  create(dto: CrearEjercicioDto): Promise<Ejercicio> { return this.service.create(dto); }
}
```

```typescript
// modules/ejercicios/decorators/cache-ejercicios.decorator.ts
import type { Ejercicio, GrupoMuscular } from '@repo/database';
import type { CrearEjercicioDto } from '../dtos/crear-ejercicio.dto';
import { BaseDecorator } from './base.decorator';

export class CacheEjerciciosDecorator extends BaseDecorator {
  private readonly cache = new Map<string, Ejercicio | Ejercicio[]>();

  async findAll(): Promise<Ejercicio[]> {
    const key = 'all';
    const cached = this.cache.get(key) as Ejercicio[] | undefined;
    if (cached !== undefined) return cached;
    const result = await super.findAll();
    this.cache.set(key, result);
    return result;
  }

  async findById(id: string): Promise<Ejercicio | null> {
    const key = `id:${id}`;
    const cached = this.cache.get(key) as Ejercicio | undefined;
    if (cached !== undefined) return cached;
    const result = await super.findById(id);
    if (result !== null) this.cache.set(key, result);
    return result;
  }

  async findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]> {
    const key = `grupo:${grupo}`;
    const cached = this.cache.get(key) as Ejercicio[] | undefined;
    if (cached !== undefined) return cached;
    const result = await super.findByGrupo(grupo);
    this.cache.set(key, result);
    return result;
  }

  flush(): void { this.cache.clear(); }

  async create(dto: CrearEjercicioDto): Promise<Ejercicio> {
    const result = await super.create(dto);
    this.flush();
    return result;
  }
}
```

### Cómo funciona

- En `EjerciciosModule` se registra bajo el token `'EJERCICIOS_SERVICE'`:
  ```typescript
  providers: [
    EjerciciosServiceImpl,
    {
      provide: 'EJERCICIOS_SERVICE',
      useFactory: (impl: EjerciciosServiceImpl) => new CacheEjerciciosDecorator(impl),
      inject: [EjerciciosServiceImpl],
    },
  ]
  ```
- El controller inyecta `@Inject('EJERCICIOS_SERVICE')` — no sabe que hay un cache.
- La segunda llamada a `GET /api/ejercicios` no toca Prisma.

### Reflejo en el frontend

La primera llamada a `/api/ejercicios` consulta la DB; la segunda retorna del cache. En la UI esto es transparente — la lista de ejercicios carga más rápido en visitas subsecuentes. El e2e test verifica: "segunda llamada a `GET /ejercicios` no consulta Prisma".

---

## 3. Command + CommandInvoker

**Propósito:** Encapsular acciones como objetos con undo. Historial bounded a 50 commands. Tres commands concretos: `InvitarClienteCommand`, `DesactivarClienteCommand`, `ArchivarPlanCommand`.

### Interfaz y Invoker

```typescript
// commands/command.interface.ts
export interface Command<T = unknown> {
  execute(): Promise<T>;
  undo(): Promise<void>;
  descripcion(): string;
}
```

```typescript
// commands/command-invoker.service.ts
import { Injectable } from '@nestjs/common';
import { Command } from './command.interface';

@Injectable()
export class CommandInvokerService {
  private readonly historial: Command[] = [];
  private readonly maxHistorial = 50;

  async ejecutar<T>(command: Command<T>): Promise<T> {
    const resultado = await command.execute();
    this.historial.push(command);
    this.recortarHistorial();
    return resultado;
  }

  async deshacer(): Promise<void> {
    const command = this.historial.pop();
    if (!command) return;
    await command.undo();
  }

  async deshacerUltimo(): Promise<void> {
    await this.deshacer();
  }

  getHistorial(): Command[] {
    return [...this.historial];
  }

  private recortarHistorial(): void {
    if (this.historial.length <= this.maxHistorial) return;
    this.historial.splice(0, this.historial.length - this.maxHistorial);
  }
}
```

### Commands concretos

```typescript
// modules/clientes/commands/invitar-cliente.command.ts
import { randomUUID } from 'node:crypto';
import { type Invitacion } from '@repo/database';
import { type Command } from '../../../commands/command.interface';
import { type InvitacionesRepository } from '../../invitaciones/repositories/invitaciones.repository';
import { type MailerService } from '../../mailer/mailer.service';

const MILISEGUNDOS_24_HORAS = 24 * 60 * 60 * 1000;

export class InvitarClienteCommand implements Command<Invitacion> {
  private invitacionId?: string;
  private token?: string;

  constructor(
    private readonly invitacionesRepository: InvitacionesRepository,
    private readonly mailer: MailerService,
    private readonly workspaceId: string,
    private readonly correo: string,
  ) {}

  async execute(): Promise<Invitacion> {
    const token = randomUUID();
    const invitacion = await this.invitacionesRepository.crear({
      espacioDeTrabajoId: this.workspaceId,
      correo: this.correo,
      token,
      expiraEn: new Date(Date.now() + MILISEGUNDOS_24_HORAS),
    });
    this.invitacionId = invitacion.id;
    this.token = token;
    await this.mailer.enviarInvitacion(this.correo, token);
    return invitacion;
  }

  async undo(): Promise<void> {
    if (!this.invitacionId) return;
    await this.invitacionesRepository.marcarConsumidaPorId(this.invitacionId);
  }

  descripcion(): string {
    return `Invitar cliente ${this.correo} al workspace ${this.workspaceId}`;
  }

  getToken(): string | undefined { return this.token; }
}
```

```typescript
// modules/clientes/commands/desactivar-cliente.command.ts
import { type Command } from '../../../commands/command.interface';
import { type ClienteConPerfil } from '../repositories/clientes.repository';
import { type ClientesService } from '../services/clientes.service';

export class DesactivarClienteCommand implements Command<ClienteConPerfil> {
  private clienteDesactivadoId?: string;

  constructor(
    private readonly clientesService: ClientesService,
    private readonly clienteId: string,
    private readonly workspaceId: string,
  ) {}

  async execute(): Promise<ClienteConPerfil> {
    const cliente = await this.clientesService.softDelete(this.clienteId, this.workspaceId);
    this.clienteDesactivadoId = cliente.id;
    return cliente;
  }

  async undo(): Promise<void> {
    if (!this.clienteDesactivadoId) return;
    await this.clientesService.restaurar(this.clienteDesactivadoId, this.workspaceId);
  }

  descripcion(): string {
    return `Desactivar cliente ${this.clienteId} del workspace ${this.workspaceId}`;
  }
}
```

```typescript
// modules/planes-entrenamiento/commands/archivar-plan.command.ts
import { EstadoPlan } from '@repo/database';
import type { Command } from '../../../commands/command.interface';
import type { PlanConEjercicios } from '../repositories/planes-entrenamiento.repository';
import type { PlanesEntrenamientoService } from '../services/planes-entrenamiento.service';

export class ArchivarPlanCommand implements Command<PlanConEjercicios> {
  private estadoPrevio?: EstadoPlan;

  constructor(
    private readonly planesService: PlanesEntrenamientoService,
    private readonly planId: string,
    private readonly workspaceId: string,
  ) {}

  async execute(): Promise<PlanConEjercicios> {
    const plan = await this.planesService.findById(this.planId, this.workspaceId);
    this.estadoPrevio = plan.estado;
    return this.planesService.archivar(this.planId, this.workspaceId);
  }

  async undo(): Promise<void> {
    if (this.estadoPrevio !== EstadoPlan.ACTIVO) return;
    await this.planesService.restaurarEstadoDesdeCommand(
      this.planId, this.workspaceId, this.estadoPrevio,
    );
  }

  descripcion(): string {
    return `Archivar plan ${this.planId} del workspace ${this.workspaceId}`;
  }
}
```

### Cómo funciona

- Controller inyecta `CommandInvokerService` y llama `commandInvoker.ejecutar(new InvitarClienteCommand(...))`
- `POST /api/commands/undo` llama `commandInvoker.deshacerUltimo()` — invoca `undo()` del último command del historial
- El historial vive en memoria y se recorta a 50 entries automáticamente

### Reflejo en el frontend

El flujo de "invitar cliente" o "desactivar cliente" son acciones normales que el frontend ejecuta via `POST`. El undo es un botón "Deshacer" que llama a `POST /api/commands/undo`. En el workspace del entrenador, cuando se desactiva un cliente la fila se deshabilita; al hacer undo vuelve a aparecer activa. En el dashboard del cliente no se nota — el command actúa sobre el servicio que el dashboard ya consume.

---

## 4. Factory Method

**Propósito:** Crear planes con defaults según tipo, sin switch/if. Tres factories concretas con valores distintos.

### Implementación

```typescript
// modules/planes-entrenamiento/factories/plan.factory.ts
import { type TipoPlanEntrenamiento } from '@repo/database';

export interface CrearPlanFactoryDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanEntrenamiento;
}

export interface EjercicioPlanDraftDefaults {
  series: number;
  repeticiones: number;
  segundosDeDescanso: number;
}

export interface PlanDraft {
  nombre: string;
  descripcion?: string;
  tipo: TipoPlanEntrenamiento;
  ejercicioDefaults: EjercicioPlanDraftDefaults;
}

export abstract class PlanFactory {
  abstract crear(dto: CrearPlanFactoryDto): PlanDraft;
}
```

```typescript
// modules/planes-entrenamiento/factories/fuerza.factory.ts
import { TipoPlanEntrenamiento } from '@repo/database';
import { type CrearPlanFactoryDto, type PlanDraft, PlanFactory } from './plan.factory';

export class FuerzaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: TipoPlanEntrenamiento.FUERZA,
      ejercicioDefaults: { series: 5, repeticiones: 5, segundosDeDescanso: 180 },
    };
  }
}
```

```typescript
// modules/planes-entrenamiento/factories/hipertrofia.factory.ts
import { TipoPlanEntrenamiento } from '@repo/database';
import { type CrearPlanFactoryDto, type PlanDraft, PlanFactory } from './plan.factory';

export class HipertrofiaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      ejercicioDefaults: { series: 4, repeticiones: 10, segundosDeDescanso: 60 },
    };
  }
}
```

```typescript
// modules/planes-entrenamiento/factories/resistencia.factory.ts
import { TipoPlanEntrenamiento } from '@repo/database';
import { type CrearPlanFactoryDto, type PlanDraft, PlanFactory } from './plan.factory';

export class ResistenciaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo: TipoPlanEntrenamiento.RESISTENCIA,
      ejercicioDefaults: { series: 3, repeticiones: 15, segundosDeDescanso: 30 },
    };
  }
}
```

```typescript
// modules/planes-entrenamiento/factories/plan-factory.provider.ts
import { Injectable } from '@nestjs/common';
import { TipoPlanEntrenamiento } from '@repo/database';
import { FuerzaFactory } from './fuerza.factory';
import { HipertrofiaFactory } from './hipertrofia.factory';
import { PlanFactory } from './plan.factory';
import { ResistenciaFactory } from './resistencia.factory';

@Injectable()
export class PlanFactoriesProvider {
  private readonly factories: Record<TipoPlanEntrenamiento, PlanFactory> = {
    [TipoPlanEntrenamiento.HIPERTROFIA]: new HipertrofiaFactory(),
    [TipoPlanEntrenamiento.FUERZA]: new FuerzaFactory(),
    [TipoPlanEntrenamiento.RESISTENCIA]: new ResistenciaFactory(),
  };

  obtener(tipo: TipoPlanEntrenamiento): PlanFactory {
    return this.factories[tipo];
  }
}
```

### Cómo funciona

- `PlanesEntrenamientoService.crear()` recibe el tipo, inyecta `PlanFactoriesProvider.obtener(tipo).crear(dto)` y obtiene un `PlanDraft` con los defaults apropiados
- Los defaults se aplican a cada `EjercicioPlan` agregado al plan
- El provider es injectable (NestJS), las factories concretas son instancias plain

### Reflejo en el frontend

En el wizard de crear plan, el entrenador selecciona "Hipertrofia", "Fuerza" o "Resistencia". El frontend envía `POST /api/planes-entrenamiento` con `{ nombre, descripcion, tipo: "HIPERTROFIA" }`. La respuesta incluye los defaults de la factory (series=4, reps=10, descanso=60s). Cuando el entrenador agrega ejercicios al plan, los campos vienen pre-poblados con esos valores.

---

## 5. State

**Propósito:** Ciclo de vida BORRADOR → ACTIVO → ARCHIVADO con transiciones válidas verificadas en cada estado. Cada estado encapsula su propia lógica de transición.

### Implementación

```typescript
// modules/planes-entrenamiento/states/plan-state.interface.ts
import type { EstadoPlan, PlanDeEntrenamiento } from '@repo/database';
import type { PlanesEntrenamientoRepositoryInterface } from '../repositories/planes-entrenamiento.repository';
import type { EventoPlan } from './subject.interface';

export interface PlanSubjectLike {
  notify?: (planId: string, evento: EventoPlan) => void | Promise<void>;
}

export interface PlanStateContext {
  repository: PlanesEntrenamientoRepositoryInterface;
  subject?: PlanSubjectLike;
}

export interface PlanState {
  activar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState>;
  archivar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState>;
  getEstado(): EstadoPlan;
}
```

```typescript
// modules/planes-entrenamiento/states/borrador.state.ts
import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, type PlanDeEntrenamiento } from '@repo/database';
import { ActivoState } from './activo.state';
import type { PlanState, PlanStateContext } from './plan-state.interface';

export class BorradorState implements PlanState {
  getEstado(): EstadoPlan { return EstadoPlan.BORRADOR; }

  async activar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState> {
    const cantidadEjercicios = await ctx.repository.contarEjercicios(plan.id);
    if (cantidadEjercicios < 1) {
      throw new BadRequestException('No se puede activar un plan sin ejercicios');
    }
    await ctx.repository.updateEstado(plan.id, EstadoPlan.ACTIVO);
    await ctx.subject?.notify?.(plan.id, { tipo: 'PLAN_ACTIVADO', planId: plan.id });
    return new ActivoState();
  }

  archivar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('No se puede archivar un plan en borrador'));
  }
}
```

```typescript
// modules/planes-entrenamiento/states/activo.state.ts
import { BadRequestException } from '@nestjs/common';
import { EstadoPlan, type PlanDeEntrenamiento } from '@repo/database';
import { ArchivadoState } from './archivado.state';
import type { PlanState, PlanStateContext } from './plan-state.interface';

export class ActivoState implements PlanState {
  getEstado(): EstadoPlan { return EstadoPlan.ACTIVO; }

  activar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('El plan ya está activo'));
  }

  async archivar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState> {
    await ctx.repository.updateEstado(plan.id, EstadoPlan.ARCHIVADO);
    await ctx.subject?.notify?.(plan.id, { tipo: 'PLAN_ARCHIVADO', planId: plan.id });
    return new ArchivadoState();
  }
}
```

```typescript
// modules/planes-entrenamiento/states/archivado.state.ts
import { BadRequestException } from '@nestjs/common';
import { EstadoPlan } from '@repo/database';
import type { PlanState } from './plan-state.interface';

export class ArchivadoState implements PlanState {
  getEstado(): EstadoPlan { return EstadoPlan.ARCHIVADO; }

  activar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('No se puede activar un plan archivado'));
  }

  archivar(): Promise<PlanState> {
    return Promise.reject(new BadRequestException('El plan ya está archivado'));
  }
}
```

```typescript
// modules/planes-entrenamiento/states/state.factory.ts
import { Injectable } from '@nestjs/common';
import { EstadoPlan } from '@repo/database';
import { ActivoState } from './activo.state';
import { ArchivadoState } from './archivado.state';
import { BorradorState } from './borrador.state';
import { PlanState } from './plan-state.interface';

@Injectable()
export class PlanStateFactory {
  fromEstado(estado: EstadoPlan): PlanState {
    const states: Record<EstadoPlan, PlanState> = {
      [EstadoPlan.BORRADOR]: new BorradorState(),
      [EstadoPlan.ACTIVO]: new ActivoState(),
      [EstadoPlan.ARCHIVADO]: new ArchivadoState(),
    };
    return states[estado];
  }
}
```

### Cómo funciona

- `PlanesEntrenamientoService.activar()` obtiene el estado actual via `PlanStateFactory.fromEstado(plan.estado)`, luego llama `state.activar(plan, { repository, subject })`
- Cada estado sabe qué transiciones son válidas y lanza `BadRequestException` si se intenta una inválida
- States actualizan DB via `ctx.repository.updateEstado()` y notifican observers via `ctx.subject?.notify()`
- `ArchivadoState` es terminal — ninguna transición es válida desde ahí

### Reflejo en el frontend

En la UI del plan, los botones "Activar" y "Archivar" están condicionados al estado:
- Si el plan está en BORRADOR y tiene 0 ejercicios → el botón "Activar" muestra error del backend
- Si está en BORRADOR con ejercicios → el botón "Activar" llama `PATCH /api/planes-entrenamiento/:id/activar`
- Si está ACTIVO → el botón "Archivar" aparece; "Activar" desaparece
- Si está ARCHIVADO → ambos botones desaparecen

---

## 6. Observer

**Propósito:** Notificar a clientes cuando un plan cambia (in-app + email). `PlanSubject` mantiene el registro de observers por plan; dos observers concretos: `ClienteObserver` (BD) y `EmailNotificationObserver` (mail).

### Implementación

```typescript
// modules/planes-entrenamiento/observers/subject.interface.ts
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

```typescript
// modules/planes-entrenamiento/observers/plan-subject.service.ts
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
    if (!observers) return;
    observers.delete(observer);
    if (observers.size === 0) this.observersPorPlan.delete(planId);
  }

  async notify(planId: string, evento: EventoPlan): Promise<void> {
    const observers = this.observersPorPlan.get(planId);
    if (!observers) return;
    await Promise.all(Array.from(observers).map(async (o) => o.update(evento)));
  }
}
```

```typescript
// modules/planes-entrenamiento/observers/cliente.observer.ts
import type { NotificacionesRepository } from '../../notificaciones/repositories/notificaciones.repository';
import type { EventoPlan, Observer } from './subject.interface';

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

  private crearMensaje(evento: EventoPlan): string {
    const mensajes: Record<EventoPlan['tipo'], string> = {
      PLAN_ACTIVADO: 'Tu plan de entrenamiento fue activado.',
      PLAN_MODIFICADO: 'Tu plan de entrenamiento fue modificado.',
      PLAN_ARCHIVADO: 'Tu plan de entrenamiento fue archivado.',
    };
    return mensajes[evento.tipo];
  }
}
```

```typescript
// modules/planes-entrenamiento/observers/email-notification.observer.ts
import type { MailerService } from '../../mailer/mailer.service';
import type { EventoPlan, Observer } from './subject.interface';

export class EmailNotificationObserver implements Observer {
  constructor(private readonly mailer: MailerService, private readonly correoCliente: string) {}

  async update(evento: EventoPlan): Promise<void> {
    await this.mailer.enviarCambioPlan(this.correoCliente, this.crearMensaje(evento));
  }

  private crearMensaje(evento: EventoPlan): string {
    const mensajes: Record<EventoPlan['tipo'], string> = {
      PLAN_ACTIVADO: 'Tu plan de entrenamiento fue activado.',
      PLAN_MODIFICADO: 'Tu plan de entrenamiento fue modificado.',
      PLAN_ARCHIVADO: 'Tu plan de entrenamiento fue archivado.',
    };
    return mensajes[evento.tipo];
  }
}
```

### Cómo funciona

- `AsignacionesService.asignar()` subscribe observers al `PlanSubject` para ese `planId`: `ClienteObserver(notificacionesRepository, clienteId)` + `EmailNotificationObserver(mailer, correoCliente)`
- Cuando `PlanesEntrenamientoService.activar()` completa, el state llama `ctx.subject?.notify()` con el evento
- `PlanSubject.notify()` itera los observers registrados y llama `update(evento)` en paralelo

### Reflejo en el frontend

Cuando el entrenador activa un plan asignado a un cliente:
1. El cliente recibe una notificación in-app (visible en `GET /api/notificaciones` — la campana muestra badge)
2. El cliente recibe un email vía Mailtrap
3. En la UI del cliente (`/cliente/planes`), el plan aparece como "ACTIVO" con el mensaje de notificación correspondiente

---

## 7. Builder

**Propósito:** Construir registros de entrenamiento con múltiples campos opcionales y validación en `build()`. Interfaz fluent con method chaining.

### Implementación

```typescript
// modules/registros/builders/registro-entrenamiento.builder.ts
import { BadRequestException } from '@nestjs/common';
import type { GrupoMuscular } from '@repo/database';

export interface RegistroDeEjercicioDraft {
  ejercicioId?: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  series: number;
  repeticiones: number;
  pesoKg?: number;
  notas?: string;
}

export interface RegistroEntrenamientoDraft {
  fecha: Date;
  clienteId: string;
  planDeEntrenamientoId?: string;
  ejercicios: RegistroDeEjercicioDraft[];
  notas?: string;
  duracionMin?: number;
}

export class RegistroEntrenamientoBuilder {
  private fecha?: Date;
  private clienteId?: string;
  private planDeEntrenamientoId?: string;
  private readonly ejercicios: RegistroDeEjercicioDraft[] = [];
  private notas?: string;
  private duracionMin?: number;

  setFecha(fecha: Date): this { this.fecha = new Date(fecha); return this; }
  setClienteId(clienteId: string): this { this.clienteId = clienteId; return this; }
  setPlanDeEntrenamientoId(planDeEntrenamientoId: string): this { this.planDeEntrenamientoId = planDeEntrenamientoId; return this; }
  addEjercicio(ejercicio: RegistroDeEjercicioDraft): this { this.ejercicios.push({ ...ejercicio }); return this; }
  setNotas(notas: string): this { this.notas = notas; return this; }
  setDuracionMin(duracionMin: number): this { this.duracionMin = duracionMin; return this; }

  build(): Readonly<RegistroEntrenamientoDraft> {
    if (!this.fecha) throw new BadRequestException('La fecha del registro es obligatoria');
    if (!this.clienteId) throw new BadRequestException('El cliente del registro es obligatorio');
    if (this.ejercicios.length < 1) throw new BadRequestException('El registro debe tener al menos un ejercicio');
    return Object.freeze({
      fecha: new Date(this.fecha),
      clienteId: this.clienteId,
      planDeEntrenamientoId: this.planDeEntrenamientoId,
      ejercicios: this.ejercicios.map((e) => ({ ...e })),
      notas: this.notas,
      duracionMin: this.duracionMin,
    });
  }
}
```

### Cómo funciona

- `RegistrosService.crear()` recibe un DTO y aplica setters iterando sobre los ejercicios del DTO
- `build()` valida fecha + clienteId + ≥1 ejercicio; si falta algo lanza `BadRequestException` con mensaje descriptivo
- Retorna `Readonly` via `Object.freeze()` — el objeto es inmutable post-build

### Reflejo en el frontend

El wizard de registro (`WizardRegistro`) en 3 pasos:
1. Paso 1: fecha, duración, notas
2. Paso 2: seleccionar ejercicios (cada uno con series, reps, peso)
3. Paso 3: confirmar

Cada paso dispatcha una acción a un reducer que actualiza el estado local. Al enviar `POST /api/clientes/:id/registros-entrenamiento`, el body tiene la estructura que el builder espera. Si el backend rechaza (falta ejercicio), el frontend muestra el error de validación del builder.

---

## 8. Strategy

**Propósito:** Múltiples formas de calcular progreso del cliente, intercambiables en runtime. Tres estrategias: semanal (ISO weeks), mensual (YYYY-MM), por plan.

### Implementación

```typescript
// modules/progreso/strategies/progreso-strategy.interface.ts
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';

export interface PeriodoResumen {
  etiqueta: string;
  totalSesiones: number;
  totalEjercicios: number;
  duracionTotalMin: number;
}

export interface ProgresoResumen {
  totalSesiones: number;
  periodos: PeriodoResumen[];
}

export interface AsignacionPeriodo {
  planDeEntrenamientoId: string;
  etiqueta: string;
  asignadoEn: Date;
}

export interface ProgresoStrategyContexto {
  asignaciones?: AsignacionPeriodo[];
}

export interface ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen;
}
```

```typescript
// modules/progreso/strategies/progreso-semanal.strategy.ts
import { Injectable } from '@nestjs/common';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type { PeriodoResumen, ProgresoResumen, ProgresoStrategy, ProgresoStrategyContexto } from './progreso-strategy.interface';

function formatearFechaCorta(date: Date): string {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

function semanaLabel(date: Date): string {
  const fechaUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = fechaUtc.getUTCDay() || 7;
  const inicioSemana = new Date(fechaUtc);
  inicioSemana.setUTCDate(fechaUtc.getUTCDate() - dayNum + 1);
  const finSemana = new Date(inicioSemana);
  finSemana.setUTCDate(inicioSemana.getUTCDate() + 6);
  return `${formatearFechaCorta(inicioSemana)} - ${formatearFechaCorta(finSemana)}`;
}

@Injectable()
export class ProgresoSemanalStrategy implements ProgresoStrategy {
  calcular(registros: RegistroConEjercicios[], _contexto?: ProgresoStrategyContexto): ProgresoResumen {
    const mapa = new Map<string, PeriodoResumen>();
    for (const registro of registros) {
      const etiqueta = semanaLabel(new Date(registro.fecha));
      const periodo = mapa.get(etiqueta) ?? { etiqueta, totalSesiones: 0, totalEjercicios: 0, duracionTotalMin: 0 };
      periodo.totalSesiones += 1;
      periodo.totalEjercicios += registro.ejercicios.length;
      periodo.duracionTotalMin += registro.duracionMin ?? 0;
      mapa.set(etiqueta, periodo);
    }
    const periodos = Array.from(mapa.values()).sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
    return { totalSesiones: registros.length, periodos };
  }
}
```

```typescript
// modules/progreso/strategies/progreso-mensual.strategy.ts
import { Injectable } from '@nestjs/common';
import type { RegistroConEjercicios } from '../../registros/repositories/registros-entrenamiento.repository';
import type { PeriodoResumen, ProgresoResumen, ProgresoStrategy, ProgresoStrategyContexto } from './progreso-strategy.interface';

function mesLabel(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

@Injectable()
export class ProgresoMensualStrategy implements ProgresoStrategy {
  calcular(registros: RegistroConEjercicios[], _contexto?: ProgresoStrategyContexto): ProgresoResumen {
    const mapa = new Map<string, PeriodoResumen>();
    for (const registro of registros) {
      const etiqueta = mesLabel(new Date(registro.fecha));
      const periodo = mapa.get(etiqueta) ?? { etiqueta, totalSesiones: 0, totalEjercicios: 0, duracionTotalMin: 0 };
      periodo.totalSesiones += 1;
      periodo.totalEjercicios += registro.ejercicios.length;
      periodo.duracionTotalMin += registro.duracionMin ?? 0;
      mapa.set(etiqueta, periodo);
    }
    const periodos = Array.from(mapa.values()).sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
    return { totalSesiones: registros.length, periodos };
  }
}
```

### Cómo funciona

- `ProgresoService` tiene `estrategia: ProgresoStrategy` inyectado (default: semanal via constructor)
- `calcularProgreso(clienteId, vista)` recibe la vista y selecciona la estrategia según el query param
- Cada estrategia agrupa los registros differently: por semana ISO, por mes, o por plan asignado

### Reflejo en el frontend

En la página de progreso del cliente hay un selector de vista:
- "Semanal" → `GET /api/clientes/:id/progreso?vista=semanal` → gráfica agrupada por semana ("25 may - 31 may")
- "Mensual" → `GET /api/clientes/:id/progreso?vista=mensual` → gráfica agrupada por mes ("2025-05")
- "PorPlan" → `GET /api/clientes/:id/progreso?vista=porPlan` → gráfica agrupada por plan asignado

El frontend recibe la misma estructura `ProgresoResumen` con `periodos[]` y renderiza la gráfica según la vista seleccionada. El switch entre estrategias no recarga datos — se recalcula en el backend.

---

## 9. Memento

**Propósito:** Snapshot inmutable del estado del cliente antes de un soft-delete; restaurable via undo del command. `ClienteMemento` almacena el estado + timestamp; `ClienteContainer` actúa como caretaker.

### Implementación

```typescript
// modules/clientes/memento/cliente.memento.ts
export type ClienteSnapshot = Readonly<{
  id: string;
  usuarioId: string;
  entrenadorId: string;
  espacioDeTrabajoId: string;
  estaActivo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}>;

function clonarSnapshot(snapshot: ClienteSnapshot): ClienteSnapshot {
  return Object.freeze({ ...snapshot });
}

export class ClienteMemento {
  private readonly estado: ClienteSnapshot;
  private readonly timestamp: Date;

  constructor(estado: ClienteSnapshot, timestamp = new Date()) {
    this.estado = clonarSnapshot(estado);
    this.timestamp = new Date(timestamp);
  }

  getEstado(): ClienteSnapshot { return clonarSnapshot(this.estado); }
  getTimestamp(): Date { return new Date(this.timestamp); }
}
```

```typescript
// modules/clientes/memento/cliente-container.ts
import { Injectable } from '@nestjs/common';
import { ClienteMemento, type ClienteSnapshot } from './cliente.memento';

@Injectable()
export class ClienteContainer {
  private readonly mementos = new Map<string, ClienteMemento[]>();

  guardar(clienteId: string, snapshot: ClienteSnapshot): ClienteMemento {
    const memento = new ClienteMemento(snapshot);
    const historial = this.mementos.get(clienteId) ?? [];
    historial.push(memento);
    this.mementos.set(clienteId, historial);
    return memento;
  }

  restaurarUltimo(clienteId: string): ClienteMemento | null {
    const historial = this.mementos.get(clienteId);
    if (!historial?.length) return null;
    const memento = historial.pop() ?? null;
    if (historial.length === 0) this.mementos.delete(clienteId);
    return memento;
  }
}
```

### Cómo funciona

- `ClientesService.softDelete()` guarda snapshot en container antes de `repo.setActivo(id, false)`:
  ```typescript
  const cliente = await this.repo.findById(id);
  this.container.guardar(cliente.id, { id: cliente.id, ... });
  await this.repo.setActivo(id, false);
  ```
- `ClientesService.restaurar()` llama `container.restaurarUltimo(clienteId)` → `memento.getEstado()` → `repo.setActivo(id, true)`
- El snapshot es `Readonly` y se freezea en el constructor — inmutable

### Reflejo en el frontend

Es idéntico al flujo del Command:
- `DELETE /api/clientes/:id` → `DesactivarClienteCommand.execute()` → servicio guarda memento → `estaActivo=false`
- `POST /api/commands/undo` → `command.undo()` → `ClientesService.restaurar()` → `container.restaurarUltimo()` → `estaActivo=true`
- La fila del cliente en el workspace del entrenador reaparece como activa

---

## 10. Facade

**Propósito:** Una llamada retorna cliente + plan activo + últimos 5 registros + resumen semanal. Agrega múltiples servicios bajo un único punto de entrada.

### Implementación

```typescript
// modules/dashboard/cliente-dashboard.facade.ts
import { Injectable } from '@nestjs/common';
import { EstadoPlan } from '@repo/database';
import { ClientesService } from '../clientes/services/clientes.service';
import { PlanesEntrenamientoService } from '../planes-entrenamiento/services/planes-entrenamiento.service';
import type { ProgresoResumen } from '../progreso/strategies/progreso-strategy.interface';
import { ProgresoService } from '../progreso/services/progreso.service';
import { RegistrosService } from '../registros/services/registros.service';
import type { ClienteConPerfil } from '../clientes/repositories/clientes.repository';
import type { PlanConEjercicios } from '../planes-entrenamiento/repositories/planes-entrenamiento.repository';
import type { RegistroConEjercicios } from '../registros/repositories/registros-entrenamiento.repository';

export interface ClienteDashboard {
  cliente: ClienteConPerfil;
  planActivo: PlanConEjercicios | null;
  ultimosRegistros: RegistroConEjercicios[];
  progresoSemanal: ProgresoResumen;
}

@Injectable()
export class ClienteDashboardFacade {
  constructor(
    private readonly clientesService: ClientesService,
    private readonly planesService: PlanesEntrenamientoService,
    private readonly registrosService: RegistrosService,
    private readonly progresoService: ProgresoService,
  ) {}

  async getDashboardCliente(clienteId: string, workspaceId: string): Promise<ClienteDashboard> {
    const [cliente, planes, registrosResult, progresoSemanal] = await Promise.all([
      this.clientesService.findById(clienteId, workspaceId),
      this.planesService.findAll(workspaceId),
      this.registrosService.listar(clienteId, { page: 1, limit: 5 }),
      this.progresoService.calcularProgreso(clienteId, 'semanal'),
    ]);

    const planActivo = planes.find((p) => p.estado === EstadoPlan.ACTIVO) ?? null;

    return {
      cliente,
      planActivo,
      ultimosRegistros: registrosResult.registros,
      progresoSemanal,
    };
  }
}
```

### Cómo funciona

- Recibe solo servicios (no repositorios, no Prisma — regla del facade)
- `Promise.all` paraleliza las 4 llamadas para minimizar latencia
- Agrega los resultados en la estructura `ClienteDashboard`

### Reflejo en el frontend

En el workspace del entrenador, al hacer click en un cliente:
- `GET /api/clientes/:id/dashboard` → una llamada retorna todo lo necesario
- No hay 4+ llamadas desde el frontend para cargar el dashboard del cliente
- La UI muestra: perfil del cliente, plan activo, últimos 5 registros, resumen semanal de progreso

---

## 11. Prototype

**Propósito:** Clonar un plan existente con nombre sufijado "(copia)" y estado BORRADOR para duplicar sin recrear desde cero.

### Implementación

```typescript
// modules/planes-entrenamiento/prototypes/plan.prototype.ts
import { EstadoPlan, type EjercicioPlan, type PlanDeEntrenamiento } from '@repo/database';
import type { PlanCloneSnapshot } from '../repositories/planes-entrenamiento.repository';

export interface Cloneable<T> { clone(): T; }

type EjercicioPlanClonable = Pick<EjercicioPlan, 'ejercicioId' | 'series' | 'repeticiones' | 'segundosDeDescanso' | 'notas' | 'orden'>;

type PlanClonable = PlanDeEntrenamiento & { ejercicioPlanes?: EjercicioPlanClonable[]; };

export class PlanDeEntrenamientoPrototype implements Cloneable<PlanCloneSnapshot> {
  constructor(private readonly original: PlanClonable) {}

  clone(): PlanCloneSnapshot {
    return {
      entrenadorId: this.original.entrenadorId,
      nombre: `${this.original.nombre} (copia)`,
      descripcion: this.original.descripcion,
      tipo: this.original.tipo,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: this.original.ejercicioPlanes?.map((ejercicioPlan) => ({
        ejercicioId: ejercicioPlan.ejercicioId,
        series: ejercicioPlan.series,
        repeticiones: ejercicioPlan.repeticiones,
        segundosDeDescanso: ejercicioPlan.segundosDeDescanso,
        notas: ejercicioPlan.notas,
        orden: ejercicioPlan.orden,
      })),
    };
  }
}
```

### Cómo funciona

- `PlanesEntrenamientoService.duplicar()` carga el plan, instancia `PlanDeEntrenamientoPrototype(plan)`, llama `clone()`, persiste con `repository.crearDesdeClone(snapshot)`
- El clone tiene ids undefined (dejados por el repositorio al crear) y estado BORRADOR
- Los `EjercicioPlan` se copian con sus valores concretos, no con referencias

### Reflejo en el frontend

Botón "Duplicar" en la vista de detalle del plan:
- `POST /api/planes-entrenamiento/:id/duplicar`
- El nuevo plan aparece en la lista con nombre "Nombre del plan (copia)" en estado BORRADOR
- Los ejercicios se copiaron con los mismos valores (series, reps, descanso, orden)

---

## Flujo completo de un caso de uso real

```
Usuario: entrenador activa un plan en la UI
Frontend → PATCH /api/planes-entrenamiento/:id/activar

Backend:
PlanesEntrenamientoService.activar()
  → PlanStateFactory.fromEstado(BORRADOR) → BorradorState
  → BorradorState.activar()
      valida: ctx.repository.contarEjercicios(plan.id) >= 1
      actualiza: ctx.repository.updateEstado(plan.id, ACTIVO)
      notifica: ctx.subject?.notify(plan.id, { tipo: 'PLAN_ACTIVADO', planId })
        → PlanSubject.notify()
            → ClienteObserver.update() → NotificacionRepository.crear()
            → EmailNotificationObserver.update() → MailerService.enviarCambioPlan()
      retorna: new ActivoState()

Respuesta → frontend: plan ahora está ACTIVO
```

```
Usuario: entrenador abre dashboard de un cliente
Frontend → GET /api/clientes/:id/dashboard

Backend:
ClienteDashboardFacade.getDashboardCliente()
  → Promise.all(
      clientesService.findById(),
      planesService.findAll(),
      registrosService.listar(clienteId, { page: 1, limit: 5 }),
      progresoService.calcularProgreso(clienteId, 'semanal')
    )
  → filtra plan activo
  → retorna { cliente, planActivo, ultimosRegistros, progresoSemanal }

Respuesta → frontend: dashboard completo en una llamada
```

---

## Tabla resumen

| Patrón | Archivos clave | Entidad | Problema que resuelve |
|--------|---------------|---------|----------------------|
| Singleton | `workspace.registry.ts`, `ejercicios.catalog.ts` | Workspace, Ejercicio | Instancia única O(1) sin DI NestJS |
| Decorator | `cache-ejercicios.decorator.ts`, `base.decorator.ts` | Ejercicio | Cache sin modificar servicio base |
| Command | `command.interface.ts`, `command-invoker.service.ts`, `*.command.ts` | Varios | Acciones con undo, historial bounded |
| Factory | `plan.factory.ts`, `*fuerza/hipertrofia/resistencia.factory.ts` | PlanEntrenamiento | Defaults según tipo sin switch/if |
| State | `borrador/activo/archivado.state.ts`, `state.factory.ts` | PlanEntrenamiento | Ciclo de vida con transiciones válidas |
| Observer | `plan-subject.service.ts`, `cliente.observer.ts`, `email-notification.observer.ts` | PlanEntrenamiento | Notificar cambios a múltiples suscriptores |
| Builder | `registro-entrenamiento.builder.ts` | RegistroEntrenamiento | Construcción de objetos complejos con opcionales |
| Strategy | `progreso-strategy.interface.ts`, `*semanal/mensual/por-plan.strategy.ts` | Progreso | Múltiples formas de calcular, intercambiables |
| Memento | `cliente.memento.ts`, `cliente-container.ts` | Cliente | Snapshot inmutable antes de soft-delete |
| Facade | `cliente-dashboard.facade.ts` | Dashboard | Agregar datos de múltiples servicios en una llamada |
| Prototype | `plan.prototype.ts` | PlanEntrenamiento | Clonar plan con nombre sufijado "(copia)" |

## Regla transversal

**Prisma solo vive en `repositories/`**. Ningún otro archivo (servicios, commands, observers, facades, strategies, factories, states) importa `PrismaService` ni `@prisma/client` para hacer queries. Esta regla es load-bearing delMVP — violarla es un bug del patrón.