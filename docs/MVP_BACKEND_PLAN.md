# Plan Backend MVP — Fitness SaaS (NestJS)

Plan atomizado por fases para el backend. Cada paso es una unidad de trabajo independiente que termina con código compilando y, cuando aplica, con un test en verde o un endpoint respondiendo 200.

Referencias cruzadas: `MVP_FRONTEND_PLAN.md`, `deep-dive-patterns.md`, `design-patterns.md`, `poster.pdf`, `system_design_analysis.md`.

---

## 0. Convenciones

- Ruta raíz del backend: `apps/api/`.
- Todos los módulos cuelgan de `apps/api/src/modules/<nombre>/`.
- Estructura de un módulo: `controllers/`, `services/`, `dtos/`, y subcarpeta del patrón cuando aplica (`factories/`, `builders/`, `states/`, `strategies/`, `observers/`, `decorators/`, `prototypes/`, `memento/`, `commands/`).
- Validación: `class-validator` + `class-transformer` con `ValidationPipe` global.
- Respuestas: JSON con shape `{ data: ... }` para éxito y filtro global de excepciones `{ statusCode, mensaje, error }`.
- Prefijo global de rutas: `/api`.
- Cada fase termina con un commit independiente con mensaje `feat(api): <fase> — <resumen>`.

---

## Fase B0 — Limpieza del schema y baseline de infra

**Objetivo:** dejar el repo listo para construir encima, con schema mínimo y `.env` cargado.

### B0.1 Limpiar `packages/database/prisma/schema.prisma`
- Eliminar modelos: `PerfilDelCliente`, `PlanDeNutricion`, `Comida`, `AsignacionPlanNutricion`, `RegistroDeNutricion`, `RegistroBiometrico`, `RefreshToken`.
- Eliminar relaciones a esos modelos en `Cliente`, `Entrenador` y `Usuario`.
- Mantener: `EspacioDeTrabajo`, `Usuario`, `Entrenador`, `Cliente`, `Invitacion`, `Ejercicio`, `PlanDeEntrenamiento`, `EjercicioPlan`, `AsignacionPlanEntrenamiento`, `RegistroDeEntrenamiento`, `RegistroDeEjercicio`.

### B0.2 Agregar enum y modelo nuevos
- Enum `TipoPlanEntrenamiento { HIPERTROFIA FUERZA RESISTENCIA }`.
- Campo en `PlanDeEntrenamiento`: `tipo TipoPlanEntrenamiento` (no opcional, sin default).
- Modelo `Notificacion`:
  ```prisma
  model Notificacion {
    id        String   @id @default(uuid())
    clienteId String
    mensaje   String
    leida     Boolean  @default(false)
    creadoEn  DateTime @default(now())
    cliente   Cliente  @relation(fields: [clienteId], references: [id], onDelete: Cascade)
    @@index([clienteId, leida])
    @@map("notificaciones")
  }
  ```
- Añadir relación `notificaciones Notificacion[]` en `Cliente`.

### B0.3 Migración baseline
- Borrar la carpeta `packages/database/prisma/migrations/` si existe (es MVP, sin datos en prod).
- `pnpm --filter @repo/database prisma migrate dev --name mvp_baseline`.
- Verificar generación de `node_modules/.prisma/client`.

### B0.4 `.env` del API
- Crear `apps/api/.env` con: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=2h`, `MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASS`, `MAILTRAP_FROM`, `APP_URL`.
- Agregar `apps/api/.env.example` con las mismas claves vacías y commitearlo.

### B0.5 ConfigModule
- Instalar `@nestjs/config`.
- En `AppModule`: `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`.
- Crear `apps/api/src/config/env.validation.ts` con `class-validator` para validar las variables al arranque.

### B0.6 Pipes, filtros y prefix global
- En `main.ts`: `app.setGlobalPrefix('api')`, `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.
- Filtro global `HttpExceptionFilter` en `apps/api/src/common/filters/`.
- Habilitar CORS para `APP_URL`.

### B0.7 Smoke test
- Endpoint `GET /api/health` que devuelve `{ ok: true }`.
- Levantar con `pnpm --filter api dev` y hacer `curl localhost:4000/api/health`.

---

## Fase B1 — Autenticación (JWT + bcrypt)

**Objetivo:** registro y login funcionando, JWT con `{ sub, rol, workspaceId }`, guards listos para el resto de fases.

### B1.1 Instalar dependencias
- `pnpm --filter api add bcryptjs @nestjs/jwt jsonwebtoken`
- `pnpm --filter api add -D @types/bcryptjs @types/jsonwebtoken`

### B1.2 Módulo `auth`
- Crear `apps/api/src/modules/auth/`.
- `AuthService` con métodos: `registrarEntrenador(dto)`, `login(dto)`, `registrarCliente(tokenInvitacion, dto)`.
- `JwtModule.registerAsync` leyendo secret/expires desde `ConfigService`.

### B1.3 Guards y decoradores comunes
- `apps/api/src/common/guards/jwt-auth.guard.ts` — extrae `Authorization: Bearer`, verifica firma, adjunta `req.user = { id, rol, workspaceId }`.
- `apps/api/src/common/guards/workspace.guard.ts` — exige que `req.user.workspaceId` exista; cuando la ruta tenga `:id` de un recurso, valida ownership consultando el repositorio correspondiente.
- `apps/api/src/common/decorators/current-user.decorator.ts`.
- `apps/api/src/common/decorators/current-workspace.decorator.ts`.
- `apps/api/src/common/decorators/roles.decorator.ts` + `RolesGuard` para diferenciar ENTRENADOR/CLIENTE.

### B1.4 Endpoint registro entrenador
- `POST /api/auth/register` body `{ correo, contrasena, nombre, apellido, nombreWorkspace }`.
- Transacción Prisma: crea `Usuario(rol=ENTRENADOR)`, `EspacioDeTrabajo`, `Entrenador`. Slug del workspace = slugify(nombreWorkspace).
- Devuelve `{ token, usuario }`.

### B1.5 Endpoint login
- `POST /api/auth/login` body `{ correo, contrasena }`.
- Compara con `bcrypt.compare`. Si OK, firma JWT con `workspaceId` resuelto según rol (ENTRENADOR vía `Entrenador.espacioDeTrabajoId`, CLIENTE vía `Cliente.espacioDeTrabajoId`).
- Devuelve `{ token, usuario }`.

### B1.6 Endpoint registro cliente vía invitación
- `POST /api/auth/cliente/register` body `{ tokenInvitacion, correo, contrasena, nombre, apellido }`.
- Valida invitación: existe, no consumida, no expirada, correo coincide.
- Transacción: crea `Usuario(rol=CLIENTE)`, `Cliente`, marca `Invitacion.consumida=true`.
- Devuelve `{ token, cliente }`.

### B1.7 Validación con DTOs
- `RegisterEntrenadorDto`, `LoginDto`, `RegistrarClienteDto` con `class-validator` (`@IsEmail`, `@MinLength`, `@IsString`).

---

## Fase B2 — Singleton: WorkspaceRegistry y EjerciciosCatalog

**Objetivo:** dos clases con `getInstance()` explícito (no NestJS singleton implícito) consumidas por el resto del sistema.

### B2.1 `WorkspaceRegistry`
- Archivo: `apps/api/src/modules/registry/workspace.registry.ts`.
- Clase con `private static instance`, `getInstance()`, mapa `Map<string, { id, slug, nombre }>`.
- Métodos: `registrar(ws)`, `buscar(id)`, `listar()`.

### B2.2 `EjerciciosCatalog`
- Archivo: `apps/api/src/modules/registry/ejercicios.catalog.ts`.
- Igual patrón Singleton. Mantiene `Map<string, Ejercicio>`.
- Métodos: `cargarDesde(prisma)`, `buscarPorGrupo(grupo)`, `obtenerTodos()`.

### B2.3 Bootstrap del catálogo
- En `main.ts`, antes de `app.listen`, llamar `await EjerciciosCatalog.getInstance().cargarDesde(prismaService)`.

### B2.4 Integración con `WorkspaceGuard`
- El guard consulta primero `WorkspaceRegistry.getInstance().buscar(workspaceId)`; si no está, hace fallback a DB y registra.

### B2.5 Tests
- `workspace.registry.spec.ts`: `getInstance()` retorna misma referencia; registrar+buscar funciona.
- `ejercicios.catalog.spec.ts`: lo mismo + carga inicial.

---

## Fase B3 — Ejercicios + Decorator (cache)

**Objetivo:** módulo de ejercicios con `CacheEjerciciosDecorator` envolviendo al impl base, transparente para los controllers.

### B3.1 Interfaz y DTOs
- `apps/api/src/modules/ejercicios/interfaces/ejercicios-service.interface.ts` con `findAll()`, `findById(id)`, `findByGrupo(grupo)`, `create(dto)`.
- DTOs: `CrearEjercicioDto` con `@IsEnum(GrupoMuscular)`.

### B3.2 `EjerciciosServiceImpl`
- Implementa la interfaz consultando Prisma directamente.

### B3.3 `BaseDecorator` abstracto
- `apps/api/src/modules/ejercicios/decorators/base.decorator.ts` que recibe `service: EjerciciosServiceInterface` y delega cada método.

### B3.4 `CacheEjerciciosDecorator`
- Extiende `BaseDecorator`. Tiene `private cache = new Map<string, any>()`.
- En `findAll()`: clave `'all'`. En `findById(id)`: clave `id:<id>`. En `findByGrupo(g)`: clave `grupo:<g>`.
- Métodos extra: `invalidate(key)`, `flush()`.
- En `create(dto)`: delega al inner service y luego llama `this.flush()`.

### B3.5 Provider compuesto
- En `EjerciciosModule`:
  ```ts
  providers: [
    EjerciciosServiceImpl,
    {
      provide: 'EJERCICIOS_SERVICE',
      useFactory: (impl) => new CacheEjerciciosDecorator(impl),
      inject: [EjerciciosServiceImpl],
    },
  ]
  ```
- El controller inyecta `@Inject('EJERCICIOS_SERVICE')`.

### B3.6 Controller y endpoints
- `GET /api/ejercicios` → `findAll()`.
- `GET /api/ejercicios/:id`.
- `GET /api/ejercicios/por-grupo/:grupoMuscular`.
- `POST /api/ejercicios` (solo ENTRENADOR) → `create()` + invalida cache.

### B3.7 Tests
- `cache-ejercicios.decorator.spec.ts`: dos llamadas a `findAll()` solo invocan una vez al impl mock; `create()` invalida cache.

---

## Fase B4 — Mailer y Command base + InvitarClienteCommand

**Objetivo:** mailer Mailtrap funcional, infraestructura Command lista, primer command end-to-end.

### B4.1 Dependencias
- `pnpm --filter api add nodemailer handlebars`
- `pnpm --filter api add -D @types/nodemailer`

### B4.2 `MailerService`
- `apps/api/src/modules/mailer/mailer.service.ts`.
- Lee credenciales Mailtrap desde `ConfigService`, crea `nodemailer.createTransport`.
- Método `enviarInvitacion(correo, token)`: carga `templates/invitacion.hbs`, compila con Handlebars con variables `{ urlInvitacion, anioActual }`, envía.

### B4.3 Template Handlebars
- `apps/api/src/modules/mailer/templates/invitacion.hbs` con HTML mínimo: saludo, botón con `urlInvitacion`, footer.

### B4.4 Interfaz `Command` y `CommandInvoker`
- `apps/api/src/modules/commands/command.interface.ts`:
  ```ts
  export interface Command<TResult = void> {
    execute(): Promise<TResult>;
    undo(): Promise<void>;
    descripcion(): string;
  }
  ```
- `apps/api/src/modules/commands/command-invoker.service.ts` con `historial: Command[]` (limitar a 50), `ejecutar(cmd)`, `deshacerUltimo()`, `getHistorial()`.

### B4.5 `InvitarClienteCommand`
- Recibe en constructor: `prisma`, `mailer`, `workspaceId`, `correo`.
- `execute()`: genera token (uuid), guarda `Invitacion` con `expiraEn = now + 24h`, envía email. Guarda `this.invitacionId` para el undo.
- `undo()`: marca la invitación como `consumida=true` (evita reuso) y registra log.

### B4.6 Endpoints
- `POST /api/clientes/invitar` body `{ correo }` → instancia el command, lo pasa al invoker.
- `GET /api/invitaciones/:token/verificar` → devuelve `{ valida, invitacion }`.
- `POST /api/commands/undo` → `invoker.deshacerUltimo()`.

### B4.7 Tests
- `invitar-cliente.command.spec.ts` con prisma+mailer mockeados: `execute` crea invitación y llama mailer; `undo` la marca consumida.
- `command-invoker.service.spec.ts`: ejecutar 3 commands → undo del último.

---

## Fase B5 — Clientes + Memento + DesactivarClienteCommand

**Objetivo:** CRUD de clientes con soft-delete reversible mediante memento.

### B5.1 `ClienteMemento` y `ClienteContainer`
- `apps/api/src/modules/clientes/memento/cliente.memento.ts`:
  ```ts
  export class ClienteMemento {
    constructor(
      private readonly estado: ClienteSnapshot,
      private readonly timestamp: Date,
    ) {}
    getEstado() { return this.estado; }
    getTimestamp() { return this.timestamp; }
  }
  ```
- `ClienteContainer` con `mementos: Map<string, ClienteMemento[]>` (por `clienteId`), métodos `guardar(clienteId, snapshot)`, `restaurarUltimo(clienteId)`.
- Tipo `ClienteSnapshot` = subset serializable del cliente.

### B5.2 `ClientesService`
- `findAllPorWorkspace(workspaceId)`.
- `findById(id, workspaceId)`.
- `update(id, dto, workspaceId)`.
- `softDelete(id, workspaceId)`: snapshot → `container.guardar` → `prisma.cliente.update({ estaActivo: false })`.
- `restaurar(id, workspaceId)`: `container.restaurarUltimo(id)` → `prisma.cliente.update({ estaActivo: true })`.

### B5.3 `DesactivarClienteCommand`
- Constructor: `clientesService`, `clienteId`, `workspaceId`.
- `execute()`: llama `softDelete`. Persiste `this.clienteId` para undo.
- `undo()`: llama `restaurar`.

### B5.4 Controller
- `GET /api/clientes` (ENTRENADOR).
- `GET /api/clientes/:id`.
- `PUT /api/clientes/:id`.
- `DELETE /api/clientes/:id` → instancia `DesactivarClienteCommand` y lo pasa al invoker.
- `POST /api/clientes/:id/restaurar` (atajo directo).

### B5.5 Tests
- `cliente.memento.spec.ts`: snapshot inmutable, timestamp correcto.
- `cliente-container.spec.ts`: guardar 2 mementos → restaurar último.
- `desactivar-cliente.command.spec.ts`: execute desactiva; undo reactiva.

---

## Fase B6 — Planes de entrenamiento: Factory + State + Prototype

**Objetivo:** módulo más cargado de patrones del MVP. Tres patrones colaborando en la misma entidad.

### B6.1 Factories
- `apps/api/src/modules/planes-entrenamiento/factories/`:
  - `plan.factory.ts` (clase abstracta con método `crear(dto): PlanDraft`).
  - `hipertrofia.factory.ts` — series=4, reps=10, descanso=60s por defecto.
  - `fuerza.factory.ts` — series=5, reps=5, descanso=180s.
  - `resistencia.factory.ts` — series=3, reps=15, descanso=30s.
- `plan-factory.provider.ts` — mapa `Record<TipoPlanEntrenamiento, PlanFactory>` inyectable.

### B6.2 States
- `apps/api/src/modules/planes-entrenamiento/states/plan-state.interface.ts`:
  ```ts
  export interface PlanState {
    activar(plan: PlanDeEntrenamiento): Promise<PlanState>;
    archivar(plan: PlanDeEntrenamiento): Promise<PlanState>;
  }
  ```
- `borrador.state.ts` — `activar` valida ≥1 `EjercicioPlan`, persiste estado=ACTIVO, dispara observers (§B7), retorna `ActivoState`. `archivar` lanza BadRequest.
- `activo.state.ts` — `archivar` persiste estado=ARCHIVADO. `activar` lanza BadRequest.
- `archivado.state.ts` — ambos lanzan BadRequest.
- `state.factory.ts` — `fromEstado(estado): PlanState`.

### B6.3 Prototype
- `apps/api/src/modules/planes-entrenamiento/prototypes/plan.prototype.ts`:
  ```ts
  export interface Cloneable<T> { clone(): T; }
  export class PlanDeEntrenamientoPrototype implements Cloneable<...> {
    constructor(private readonly plan: PlanConEjercicios) {}
    clone() { /* arma DTO con ids undefined y suffijo "(copia)" */ }
  }
  ```

### B6.4 `PlanesEntrenamientoService`
- `crear(tipo, dto, entrenadorId)` → escoge factory → persiste con estado BORRADOR.
- `findAll(workspaceId)`.
- `findById(id, workspaceId)` con `include: { ejercicios: { include: { ejercicio: true } } }`.
- `activar(id, workspaceId)` → carga plan → `state.activar()`.
- `archivar(id, workspaceId)` → `state.archivar()`.
- `duplicar(id, workspaceId)` → prototype.clone() → persiste.
- `agregarEjercicio(planId, dto)` → crea `EjercicioPlan`. Si plan ACTIVO, dispara observers.
- `quitarEjercicio(planId, ejercicioPlanId)`.

### B6.5 Controller
- `POST /api/planes-entrenamiento` body `{ nombre, descripcion, tipo }`.
- `GET /api/planes-entrenamiento`.
- `GET /api/planes-entrenamiento/:id`.
- `PATCH /api/planes-entrenamiento/:id/activar`.
- `PATCH /api/planes-entrenamiento/:id/archivar`.
- `POST /api/planes-entrenamiento/:id/duplicar`.
- `POST /api/planes-entrenamiento/:id/ejercicios` body `{ ejercicioId, series, repeticiones, segundosDeDescanso, orden, notas? }`.
- `DELETE /api/planes-entrenamiento/:id/ejercicios/:ejercicioPlanId`.

### B6.6 Tests
- `hipertrofia.factory.spec.ts`, `fuerza.factory.spec.ts`, `resistencia.factory.spec.ts`: defaults correctos.
- `borrador.state.spec.ts`: activar sin ejercicios lanza error; con ejercicios transiciona.
- `activo.state.spec.ts`: archivar transiciona; activar lanza error.
- `plan.prototype.spec.ts`: clone genera nuevo objeto con ids vacíos y suffijo.

---

## Fase B7 — Asignaciones + Observer

**Objetivo:** asignar plan a cliente y notificar (in-app + email) cuando un plan activo cambia.

### B7.1 Interfaces Observer
- `apps/api/src/modules/planes-entrenamiento/observers/subject.interface.ts`:
  ```ts
  export interface Observer { update(evento: EventoPlan): Promise<void>; }
  export interface Subject {
    subscribe(o: Observer): void;
    unsubscribe(o: Observer): void;
    notify(evento: EventoPlan): Promise<void>;
  }
  ```
- Tipo `EventoPlan = { tipo: 'PLAN_ACTIVADO' | 'PLAN_MODIFICADO' | 'PLAN_ARCHIVADO'; planId: string; clienteId: string }`.

### B7.2 `PlanSubject`
- Servicio scope DEFAULT (singleton NestJS) que mantiene `Map<planId, Set<Observer>>`.
- `notify(planId, evento)` → itera observers.

### B7.3 Observers concretos
- `cliente.observer.ts` — recibe `prisma`, crea fila en `Notificacion` con mensaje según tipo de evento.
- `email-notification.observer.ts` — recibe `mailer`, envía email simple usando otro template `cambio-plan.hbs`.

### B7.4 `AsignacionesService`
- `asignarEntrenamiento({ clienteId, planEntrenamientoId })`:
  1. Verifica cliente y plan en mismo workspace.
  2. Verifica plan estado=ACTIVO.
  3. Crea `AsignacionPlanEntrenamiento(estado=ACTIVO)`.
  4. Suscribe `ClienteObserver(clienteId)` y `EmailObserver(correoCliente)` al `PlanSubject` para ese `planId`.
- `cambiarEstado(asignacionId, estado)`.

### B7.5 Disparo desde §B6
- En `activar()` → tras persistir → `subject.notify({ tipo: 'PLAN_ACTIVADO' })` por cada asignación.
- En `agregarEjercicio()/quitarEjercicio()` si plan ACTIVO → `'PLAN_MODIFICADO'`.
- En `archivar()` → `'PLAN_ARCHIVADO'`.

### B7.6 Controller asignaciones
- `POST /api/asignaciones/entrenamiento`.
- `GET /api/clientes/:id/asignaciones`.
- `PUT /api/asignaciones/:id` body `{ estado }`.

### B7.7 Endpoint notificaciones (consumido por el frontend)
- `GET /api/notificaciones` (CLIENTE) — lista no leídas del cliente del JWT.
- `PATCH /api/notificaciones/:id/leer`.

### B7.8 Tests
- `plan-subject.spec.ts`: subscribe/unsubscribe/notify llama a observers correctos.
- `cliente.observer.spec.ts`: persiste notificación con mensaje según evento.

---

## Fase B8 — Registros + Builder + ArchivarPlanCommand

**Objetivo:** registrar entrenamientos vía Builder y completar el tercer command (archivar plan con undo).

### B8.1 `RegistroEntrenamientoBuilder`
- `apps/api/src/modules/registros/builders/registro-entrenamiento.builder.ts`:
  ```ts
  export class RegistroEntrenamientoBuilder {
    private fecha?: Date;
    private clienteId?: string;
    private ejercicios: RegistroEjercicioInput[] = [];
    private notas?: string;
    private duracionMin?: number;
    setFecha(f: Date) { this.fecha = f; return this; }
    setClienteId(id: string) { this.clienteId = id; return this; }
    addEjercicio(e: RegistroEjercicioInput) { this.ejercicios.push(e); return this; }
    setNotas(n: string) { this.notas = n; return this; }
    setDuracionMin(d: number) { this.duracionMin = d; return this; }
    build(): RegistroEntrenamientoPersistible {
      if (!this.fecha || !this.clienteId || this.ejercicios.length === 0) {
        throw new Error('Registro incompleto');
      }
      return { fecha: this.fecha, clienteId: this.clienteId, ejercicios: [...this.ejercicios], notas: this.notas, duracionMin: this.duracionMin };
    }
  }
  ```

### B8.2 `RegistrosService`
- `crear(clienteId, dto)`:
  1. Verifica cliente del workspace del usuario actual.
  2. Instancia builder, va aplicando setters/addEjercicio iterando `dto.ejercicios`.
  3. `build()` y persiste en transacción `RegistroDeEntrenamiento` + `RegistroDeEjercicio[]`.
- `listar(clienteId, { page, limit, desde, hasta })`.

### B8.3 Controller
- `POST /api/clientes/:id/registros-entrenamiento`.
- `GET /api/clientes/:id/registros-entrenamiento` con paginación.

### B8.4 `ArchivarPlanCommand`
- Constructor: `planesService`, `planId`, `workspaceId`.
- `execute()`: guarda el estado anterior en `this.estadoPrevio` y llama `archivar()`.
- `undo()`: si `estadoPrevio === ACTIVO`, llama `activar()`.

### B8.5 Endpoint
- `PATCH /api/planes-entrenamiento/:id/archivar` ahora pasa por el invoker.

### B8.6 Tests
- `registro-entrenamiento.builder.spec.ts`: build sin ejercicios falla; con ejercicios construye objeto correcto.
- `archivar-plan.command.spec.ts`: execute archiva; undo restaura estado previo.

---

## Fase B9 — Progreso + Strategy

**Objetivo:** tres estrategias intercambiables seleccionables por query param.

### B9.1 Interfaz y tipos
- `apps/api/src/modules/progreso/strategies/progreso-strategy.interface.ts`:
  ```ts
  export interface ProgresoStrategy {
    calcular(registros: RegistroDeEntrenamientoConDetalles[]): ProgresoResumen;
  }
  export type ProgresoResumen = { etiqueta: string; periodos: PeriodoResumen[] };
  export type PeriodoResumen = { etiqueta: string; entrenamientos: number; volumenTotal: number; pesoPromedio: number };
  ```

### B9.2 Estrategias concretas
- `progreso-semanal.strategy.ts` — agrupa por ISO week, calcula por semana.
- `progreso-mensual.strategy.ts` — agrupa por `YYYY-MM`.
- `progreso-por-plan.strategy.ts` — agrupa por plan asignado vigente al momento del registro.

### B9.3 `ProgresoContext` (= servicio)
- `apps/api/src/modules/progreso/progreso.service.ts`:
  - `setEstrategia(s: ProgresoStrategy)`.
  - `calcularProgreso(clienteId, workspaceId, vista)`: carga registros con detalle, instancia strategy según `vista`, devuelve `resumen`.

### B9.4 Endpoint
- `GET /api/clientes/:id/progreso?vista=semanal|mensual|porPlan` (default `semanal`).
- Validación: `@IsIn(['semanal','mensual','porPlan'])` en query DTO.

### B9.5 Tests
- Una `*.spec.ts` por strategy con dataset fijo en memoria (sin Prisma).
- `progreso.service.spec.ts`: selecciona la strategy correcta según query.

---

## Fase B10 — Dashboard + Facade

**Objetivo:** un único endpoint que el frontend consume para la pantalla principal del cliente.

### B10.1 `ClienteDashboardFacade`
- `apps/api/src/modules/dashboard/cliente-dashboard.facade.ts`.
- Constructor inyecta: `ClientesService`, `PlanesEntrenamientoService`, `RegistrosService`, `ProgresoService`.
- Método `getDashboardCliente(clienteId, workspaceId)`:
  1. `cliente = clientesService.findById(clienteId, workspaceId)`.
  2. `asignacionActiva = clientesService.asignacionActivaEntrenamiento(clienteId)` → derivar `planActivo`.
  3. `ultimosRegistros = registrosService.listar(clienteId, { page:1, limit:5 })`.
  4. `resumenProgreso = progresoService.calcularProgreso(clienteId, workspaceId, 'semanal')`.
  5. Retorna `{ cliente, planActivo, ultimosRegistros, resumenProgreso }` tipado.

### B10.2 Endpoint
- `GET /api/clientes/:id/dashboard` (ENTRENADOR).

### B10.3 Tests
- `cliente-dashboard.facade.spec.ts` con todos los servicios mockeados, verifica composición y orden de llamadas.

---

## Fase B11 — Tests unitarios consolidados + e2e happy path

**Objetivo:** cobertura mínima de los patrones y un e2e que recorra el flujo completo.

### B11.1 Configuración Jest e2e
- `apps/api/test/jest-e2e.json` ya existe (NestJS default). Ajustar `testEnvironment` y `globalSetup` para limpiar DB de test.
- Script `pnpm --filter api test:e2e`.
- Base de datos de test: `DATABASE_URL_TEST` apuntando a esquema separado o DB dedicada.

### B11.2 Helpers de test
- `apps/api/test/helpers/db.ts` — `truncateAll(prisma)` que limpia todas las tablas.
- `apps/api/test/helpers/auth.ts` — `registrarEntrenadorYLogin(app)`, `crearClientePorInvitacion(app, token)`.

### B11.3 e2e happy path (`apps/api/test/happy-path.e2e-spec.ts`)
Secuencia exacta:
1. `POST /auth/register` entrenador → guardar `tokenEntrenador`.
2. `POST /clientes/invitar` con `correo=cli@test`. Capturar `tokenInvitacion`.
3. `POST /auth/cliente/register` con ese token → guardar `tokenCliente`.
4. `POST /ejercicios` (3 ejercicios) — verifica que la segunda llamada `GET /ejercicios` venga de cache (espiar prisma o validar tiempo).
5. `POST /planes-entrenamiento` con `tipo=HIPERTROFIA` → guardar `planId`. Verificar defaults de la factory.
6. `POST /planes-entrenamiento/:planId/ejercicios` (×2).
7. `PATCH /planes-entrenamiento/:planId/activar` (State transition).
8. `POST /asignaciones/entrenamiento { clienteId, planEntrenamientoId }`.
9. `GET /notificaciones` con `tokenCliente` → debe haber 1 (Observer).
10. `POST /clientes/:clienteId/registros-entrenamiento` con 2 ejercicios (Builder).
11. `GET /clientes/:clienteId/dashboard` → verifica shape (Facade).
12. `GET /clientes/:clienteId/progreso?vista=semanal` → verifica `resumen.periodos.length >= 1` (Strategy).
13. `POST /planes-entrenamiento/:planId/duplicar` → verifica nuevo id y `(copia)` en nombre (Prototype).
14. `DELETE /clientes/:clienteId` → cliente queda `estaActivo=false` (Command + Memento).
15. `POST /commands/undo` → cliente vuelve a `estaActivo=true`.

### B11.4 Cobertura mínima requerida
- Cada patrón debe tener al menos un `.spec.ts` ya escrito en fases anteriores.
- Generar reporte con `pnpm --filter api test --coverage` y revisar que los archivos de patrones marquen >80% lines.

---

## Apéndice — Estructura final del backend

```
apps/api/src/
├── main.ts
├── app.module.ts
├── config/
│   └── env.validation.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   └── guards/
└── modules/
    ├── auth/
    ├── registry/
    │   ├── workspace.registry.ts
    │   └── ejercicios.catalog.ts
    ├── ejercicios/
    │   ├── decorators/
    │   ├── interfaces/
    │   └── ejercicios.service.ts (impl)
    ├── mailer/
    │   └── templates/
    ├── commands/
    │   ├── command.interface.ts
    │   └── command-invoker.service.ts
    ├── clientes/
    │   └── memento/
    ├── planes-entrenamiento/
    │   ├── factories/
    │   ├── states/
    │   ├── prototypes/
    │   └── observers/
    ├── asignaciones/
    ├── registros/
    │   └── builders/
    ├── progreso/
    │   └── strategies/
    ├── dashboard/
    │   └── cliente-dashboard.facade.ts
    └── notificaciones/
```
