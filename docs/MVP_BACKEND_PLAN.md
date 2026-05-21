# Plan Backend MVP — Fitness SaaS (NestJS)

Plan atomizado por fases para el backend. Cada paso es una unidad de trabajo independiente que termina con código compilando y, cuando aplica, con un test en verde o un endpoint respondiendo 200.

Referencias cruzadas: `MVP_FRONTEND_PLAN.md`, `deep-dive-patterns.md`, `design-patterns.md`, `poster.pdf`, `system_design_analysis.md`.

---

## 0. Convenciones

- [ ] Trabajar todo bajo `apps/api/`.
- [ ] Cada módulo cuelga de `apps/api/src/modules/<nombre>/`.
- [ ] Estructura por módulo: `controllers/`, `services/`, `dtos/`, y subcarpeta del patrón (`factories/`, `builders/`, `states/`, `strategies/`, `observers/`, `decorators/`, `prototypes/`, `memento/`, `commands/`).
- [ ] Validación con `class-validator` + `class-transformer` y `ValidationPipe` global.
- [ ] Shape de respuestas: `{ data: ... }` para éxito; filtro global de excepciones para `{ statusCode, mensaje, error }`.
- [ ] Prefijo global de rutas: `/api`.
- [ ] Cerrar cada fase con commit `feat(api): <fase> — <resumen>`.

---

## Fase B0 — Limpieza del schema y baseline de infra

**Objetivo:** repo listo para construir encima, con schema mínimo y `.env` cargado.

### B0.1 Limpiar `packages/database/prisma/schema.prisma`
- [ ] Eliminar modelo `PerfilDelCliente`.
- [ ] Eliminar modelo `PlanDeNutricion`.
- [ ] Eliminar modelo `Comida`.
- [ ] Eliminar modelo `AsignacionPlanNutricion`.
- [ ] Eliminar modelo `RegistroDeNutricion`.
- [ ] Eliminar modelo `RegistroBiometrico`.
- [ ] Eliminar modelo `RefreshToken`.
- [ ] Eliminar las relaciones a esos modelos en `Cliente`, `Entrenador` y `Usuario`.
- [ ] Verificar que queden únicamente: `EspacioDeTrabajo`, `Usuario`, `Entrenador`, `Cliente`, `Invitacion`, `Ejercicio`, `PlanDeEntrenamiento`, `EjercicioPlan`, `AsignacionPlanEntrenamiento`, `RegistroDeEntrenamiento`, `RegistroDeEjercicio`.

### B0.2 Agregar enum y modelo nuevos
- [ ] Agregar enum `TipoPlanEntrenamiento { HIPERTROFIA FUERZA RESISTENCIA }`.
- [ ] Agregar campo `tipo TipoPlanEntrenamiento` en `PlanDeEntrenamiento` (no opcional, sin default).
- [ ] Agregar modelo `Notificacion(id, clienteId, mensaje, leida, creadoEn)` con relación a `Cliente` (onDelete: Cascade) e índice `[clienteId, leida]`.
- [ ] Agregar relación `notificaciones Notificacion[]` en `Cliente`.

### B0.3 Migración baseline
- [ ] Borrar carpeta `packages/database/prisma/migrations/` si existe (sin datos en prod).
- [ ] Ejecutar `pnpm --filter @repo/database prisma migrate dev --name mvp_baseline`.
- [ ] Verificar generación de `node_modules/.prisma/client`.
- [ ] Verificar que `docker compose up -d` levanta Postgres y la migración corre limpia.

### B0.4 Variables de entorno del API
- [ ] Crear `apps/api/.env` con `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=2h`, `MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASS`, `MAILTRAP_FROM`, `APP_URL`.
- [ ] Crear `apps/api/.env.example` con las mismas claves vacías.
- [ ] Commitear `.env.example`.
- [ ] Confirmar que `.env` está en `.gitignore`.

### B0.5 ConfigModule
- [ ] Instalar `@nestjs/config`.
- [ ] Registrar `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })` en `AppModule`.
- [ ] Crear `apps/api/src/config/env.validation.ts` validando variables con `class-validator`.
- [ ] Conectar `validate` del `ConfigModule` al validador.

### B0.6 Pipes, filtros y prefix global
- [ ] En `main.ts`: `app.setGlobalPrefix('api')`.
- [ ] En `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.
- [ ] Crear `apps/api/src/common/filters/http-exception.filter.ts` y registrarlo global.
- [ ] Habilitar CORS limitado a `APP_URL`.

### B0.7 Smoke test
- [ ] Crear `HealthController` con `GET /api/health` → `{ ok: true }`.
- [ ] Levantar con `pnpm --filter api dev`.
- [ ] Probar `curl localhost:4000/api/health` y confirmar 200.

---

## Fase B1 — Autenticación (JWT + bcrypt)

**Objetivo:** registro y login funcionando; JWT con `{ sub, rol, workspaceId }`; guards listos.

### B1.1 Dependencias
- [ ] `pnpm --filter api add bcryptjs @nestjs/jwt`.
- [ ] `pnpm --filter api add -D @types/bcryptjs`.

### B1.2 Módulo `auth`
- [ ] Crear `apps/api/src/modules/auth/`.
- [ ] Crear `AuthService` con `registrarEntrenador`, `login`, `registrarCliente`.
- [ ] Registrar `JwtModule.registerAsync` leyendo secret/expires del `ConfigService`.

### B1.3 Guards y decoradores comunes
- [ ] Crear `common/guards/jwt-auth.guard.ts` que valida `Authorization: Bearer` y adjunta `req.user = { id, rol, workspaceId }`.
- [ ] Crear `common/guards/workspace.guard.ts` que valida ownership del recurso vs `req.user.workspaceId`.
- [ ] Crear decorador `common/decorators/current-user.decorator.ts`.
- [ ] Crear decorador `common/decorators/current-workspace.decorator.ts`.
- [ ] Crear `common/decorators/roles.decorator.ts` + `common/guards/roles.guard.ts`.

### B1.4 Endpoint registro entrenador
- [ ] DTO `RegisterEntrenadorDto` con `correo`, `contrasena`, `nombre`, `apellido`, `nombreWorkspace`.
- [ ] Implementar transacción Prisma: crea `Usuario(rol=ENTRENADOR)`, `EspacioDeTrabajo` (slug = slugify), `Entrenador`.
- [ ] Devolver `{ token, usuario }`.
- [ ] Probar con `curl` o REST client.

### B1.5 Endpoint login
- [ ] DTO `LoginDto` con `correo`, `contrasena`.
- [ ] Validar con `bcrypt.compare`.
- [ ] Resolver `workspaceId` según rol (ENTRENADOR vía `Entrenador.espacioDeTrabajoId`, CLIENTE vía `Cliente.espacioDeTrabajoId`).
- [ ] Firmar JWT y devolver `{ token, usuario }`.

### B1.6 Endpoint registro cliente vía invitación
- [ ] DTO `RegistrarClienteDto` con `tokenInvitacion`, `correo`, `contrasena`, `nombre`, `apellido`.
- [ ] Validar invitación: existe, no consumida, no expirada, correo coincide.
- [ ] Transacción: crea `Usuario(rol=CLIENTE)` y `Cliente`; marca `Invitacion.consumida=true`.
- [ ] Devolver `{ token, cliente }`.

### B1.7 Validación con DTOs
- [ ] Aplicar `@IsEmail`, `@MinLength`, `@IsString` en los tres DTOs.
- [ ] Confirmar que envíos inválidos retornan 400 con detalle.

---

## Fase B2 — Singleton: WorkspaceRegistry y EjerciciosCatalog

**Objetivo:** dos clases con `getInstance()` explícito (no NestJS singleton implícito) consumidas por el resto del sistema.

### B2.1 `WorkspaceRegistry`
- [ ] Crear `apps/api/src/modules/registry/workspace.registry.ts`.
- [ ] Definir `private static instance` y `static getInstance()`.
- [ ] Mantener `Map<string, { id, slug, nombre }>`.
- [ ] Implementar `registrar(ws)`, `buscar(id)`, `listar()`.

### B2.2 `EjerciciosCatalog`
- [ ] Crear `apps/api/src/modules/registry/ejercicios.catalog.ts`.
- [ ] Aplicar mismo patrón Singleton.
- [ ] Mantener `Map<string, Ejercicio>`.
- [ ] Implementar `cargarDesde(prisma)`, `buscarPorGrupo(grupo)`, `obtenerTodos()`.

### B2.3 Bootstrap del catálogo
- [ ] En `main.ts` antes de `app.listen`, llamar `await EjerciciosCatalog.getInstance().cargarDesde(prismaService)`.

### B2.4 Integración con `WorkspaceGuard`
- [ ] En el guard, consultar primero `WorkspaceRegistry.getInstance().buscar(workspaceId)`.
- [ ] Fallback a DB y registrar si no estaba.

### B2.5 Tests
- [ ] `workspace.registry.spec.ts`: `getInstance()` retorna misma referencia.
- [ ] `workspace.registry.spec.ts`: registrar + buscar funcionan.
- [ ] `ejercicios.catalog.spec.ts`: `getInstance()` retorna misma referencia.
- [ ] `ejercicios.catalog.spec.ts`: `cargarDesde` puebla el mapa.

---

## Fase B3 — Ejercicios + Decorator (cache)

**Objetivo:** módulo con `CacheEjerciciosDecorator` envolviendo al impl base, transparente para los controllers.

### B3.1 Interfaz y DTOs
- [ ] Crear `ejercicios/interfaces/ejercicios-service.interface.ts` con `findAll`, `findById`, `findByGrupo`, `create`.
- [ ] DTO `CrearEjercicioDto` con `@IsEnum(GrupoMuscular)`.

### B3.2 `EjerciciosServiceImpl`
- [ ] Implementar la interfaz consultando Prisma.

### B3.3 `BaseDecorator`
- [ ] Crear `ejercicios/decorators/base.decorator.ts` que recibe `service: EjerciciosServiceInterface` y delega cada método.

### B3.4 `CacheEjerciciosDecorator`
- [ ] Extender `BaseDecorator`.
- [ ] Mantener `private cache = new Map<string, any>()`.
- [ ] Cachear `findAll` con clave `'all'`.
- [ ] Cachear `findById(id)` con clave `id:<id>`.
- [ ] Cachear `findByGrupo(g)` con clave `grupo:<g>`.
- [ ] Implementar `invalidate(key)` y `flush()`.
- [ ] En `create(dto)`: delegar al inner service y luego `this.flush()`.

### B3.5 Provider compuesto
- [ ] En `EjerciciosModule`, registrar `EjerciciosServiceImpl` como provider.
- [ ] Registrar `{ provide: 'EJERCICIOS_SERVICE', useFactory: (impl) => new CacheEjerciciosDecorator(impl), inject: [EjerciciosServiceImpl] }`.
- [ ] Inyectar `@Inject('EJERCICIOS_SERVICE')` en el controller.

### B3.6 Endpoints
- [ ] `GET /api/ejercicios`.
- [ ] `GET /api/ejercicios/:id`.
- [ ] `GET /api/ejercicios/por-grupo/:grupoMuscular`.
- [ ] `POST /api/ejercicios` (solo ENTRENADOR).

### B3.7 Tests
- [ ] `cache-ejercicios.decorator.spec.ts`: dos llamadas a `findAll()` invocan al impl una sola vez.
- [ ] `cache-ejercicios.decorator.spec.ts`: `create()` invalida cache.

---

## Fase B4 — Mailer y Command base + InvitarClienteCommand

**Objetivo:** mailer Mailtrap funcional, infraestructura Command lista, primer command end-to-end.

### B4.1 Dependencias
- [ ] `pnpm --filter api add nodemailer handlebars`.
- [ ] `pnpm --filter api add -D @types/nodemailer`.

### B4.2 `MailerService`
- [ ] Crear `apps/api/src/modules/mailer/mailer.service.ts`.
- [ ] Leer credenciales Mailtrap desde `ConfigService` y crear `nodemailer.createTransport`.
- [ ] Implementar `enviarInvitacion(correo, token)` que compila `templates/invitacion.hbs` con `{ urlInvitacion, anioActual }`.

### B4.3 Template Handlebars
- [ ] Crear `mailer/templates/invitacion.hbs` con saludo, botón con `urlInvitacion` y footer.
- [ ] Verificar que carga vía `fs.readFile` desde el dist.

### B4.4 Interfaz `Command` y `CommandInvoker`
- [ ] Crear `commands/command.interface.ts` con `execute(): Promise<T>`, `undo(): Promise<void>`, `descripcion(): string`.
- [ ] Crear `commands/command-invoker.service.ts` con `historial: Command[]` (máx. 50).
- [ ] Implementar `ejecutar(cmd)`, `deshacerUltimo()`, `getHistorial()`.

### B4.5 `InvitarClienteCommand`
- [ ] Constructor recibe `prisma`, `mailer`, `workspaceId`, `correo`.
- [ ] `execute()`: genera token uuid, persiste `Invitacion` con `expiraEn = now + 24h`, envía email.
- [ ] Guardar `this.invitacionId` para el undo.
- [ ] `undo()`: marcar la invitación como `consumida=true`.

### B4.6 Endpoints
- [ ] `POST /api/clientes/invitar` body `{ correo }`.
- [ ] `GET /api/invitaciones/:token/verificar`.
- [ ] `POST /api/commands/undo`.

### B4.7 Tests
- [ ] `invitar-cliente.command.spec.ts`: `execute` crea invitación y llama mailer.
- [ ] `invitar-cliente.command.spec.ts`: `undo` marca consumida.
- [ ] `command-invoker.service.spec.ts`: ejecutar 3 commands → undo del último deshace solo ese.

---

## Fase B5 — Clientes + Memento + DesactivarClienteCommand

**Objetivo:** CRUD de clientes con soft-delete reversible mediante memento.

### B5.1 `ClienteMemento` y `ClienteContainer`
- [ ] Crear `clientes/memento/cliente.memento.ts` con `estado`, `timestamp`, `getEstado()`, `getTimestamp()`.
- [ ] Tipar `ClienteSnapshot` como subset serializable del cliente.
- [ ] Crear `clientes/memento/cliente-container.ts` con `mementos: Map<string, ClienteMemento[]>`.
- [ ] Implementar `guardar(clienteId, snapshot)`, `restaurarUltimo(clienteId)`.

### B5.2 `ClientesService`
- [ ] Implementar `findAllPorWorkspace(workspaceId)`.
- [ ] Implementar `findById(id, workspaceId)`.
- [ ] Implementar `update(id, dto, workspaceId)`.
- [ ] Implementar `softDelete(id, workspaceId)` con snapshot → `container.guardar` → update `estaActivo=false`.
- [ ] Implementar `restaurar(id, workspaceId)` con `container.restaurarUltimo` → update `estaActivo=true`.

### B5.3 `DesactivarClienteCommand`
- [ ] Constructor recibe `clientesService`, `clienteId`, `workspaceId`.
- [ ] `execute()`: llama `softDelete` y guarda `this.clienteId`.
- [ ] `undo()`: llama `restaurar`.

### B5.4 Controller
- [ ] `GET /api/clientes` (ENTRENADOR).
- [ ] `GET /api/clientes/:id`.
- [ ] `PUT /api/clientes/:id`.
- [ ] `DELETE /api/clientes/:id` → pasa por `CommandInvoker`.
- [ ] `POST /api/clientes/:id/restaurar` (atajo directo).

### B5.5 Tests
- [ ] `cliente.memento.spec.ts`: snapshot inmutable, timestamp correcto.
- [ ] `cliente-container.spec.ts`: guardar 2 mementos → restaurar último.
- [ ] `desactivar-cliente.command.spec.ts`: execute desactiva; undo reactiva.

---

## Fase B6 — Planes: Factory + State + Prototype

**Objetivo:** módulo más cargado de patrones del MVP. Tres patrones colaborando en la misma entidad.

### B6.1 Factories
- [ ] Crear `planes-entrenamiento/factories/plan.factory.ts` (clase abstracta con `crear(dto): PlanDraft`).
- [ ] Crear `hipertrofia.factory.ts` (series=4, reps=10, descanso=60s).
- [ ] Crear `fuerza.factory.ts` (series=5, reps=5, descanso=180s).
- [ ] Crear `resistencia.factory.ts` (series=3, reps=15, descanso=30s).
- [ ] Crear `plan-factory.provider.ts` con mapa `Record<TipoPlanEntrenamiento, PlanFactory>` inyectable.

### B6.2 States
- [ ] Crear `planes-entrenamiento/states/plan-state.interface.ts` con `activar(plan)` y `archivar(plan)`.
- [ ] Crear `borrador.state.ts`: `activar` valida ≥1 ejercicio, persiste ACTIVO, dispara observers, retorna `ActivoState`.
- [ ] `borrador.state.ts`: `archivar` lanza BadRequest.
- [ ] Crear `activo.state.ts`: `archivar` persiste ARCHIVADO; `activar` lanza BadRequest.
- [ ] Crear `archivado.state.ts`: ambos lanzan BadRequest.
- [ ] Crear `state.factory.ts` con `fromEstado(estado): PlanState`.

### B6.3 Prototype
- [ ] Crear `planes-entrenamiento/prototypes/plan.prototype.ts` con interfaz `Cloneable<T>`.
- [ ] Implementar `PlanDeEntrenamientoPrototype.clone()` con ids `undefined` y nombre `<original> (copia)`.

### B6.4 `PlanesEntrenamientoService`
- [ ] Implementar `crear(tipo, dto, entrenadorId)` que elige factory y persiste BORRADOR.
- [ ] Implementar `findAll(workspaceId)`.
- [ ] Implementar `findById(id, workspaceId)` con `include: { ejercicios: { include: { ejercicio: true } } }`.
- [ ] Implementar `activar(id, workspaceId)` que delega al state actual.
- [ ] Implementar `archivar(id, workspaceId)`.
- [ ] Implementar `duplicar(id, workspaceId)` que invoca el prototype.
- [ ] Implementar `agregarEjercicio(planId, dto)` (dispara observers si plan ACTIVO).
- [ ] Implementar `quitarEjercicio(planId, ejercicioPlanId)` (dispara observers si plan ACTIVO).

### B6.5 Controller
- [ ] `POST /api/planes-entrenamiento` body `{ nombre, descripcion, tipo }`.
- [ ] `GET /api/planes-entrenamiento`.
- [ ] `GET /api/planes-entrenamiento/:id`.
- [ ] `PATCH /api/planes-entrenamiento/:id/activar`.
- [ ] `PATCH /api/planes-entrenamiento/:id/archivar`.
- [ ] `POST /api/planes-entrenamiento/:id/duplicar`.
- [ ] `POST /api/planes-entrenamiento/:id/ejercicios`.
- [ ] `DELETE /api/planes-entrenamiento/:id/ejercicios/:ejercicioPlanId`.

### B6.6 Tests
- [ ] `hipertrofia.factory.spec.ts`: defaults correctos.
- [ ] `fuerza.factory.spec.ts`: defaults correctos.
- [ ] `resistencia.factory.spec.ts`: defaults correctos.
- [ ] `borrador.state.spec.ts`: activar sin ejercicios lanza error; con ejercicios transiciona.
- [ ] `activo.state.spec.ts`: archivar transiciona; activar lanza error.
- [ ] `archivado.state.spec.ts`: ambos transitions lanzan error.
- [ ] `plan.prototype.spec.ts`: clone genera nuevo objeto con ids vacíos y suffijo `(copia)`.

---

## Fase B7 — Asignaciones + Observer

**Objetivo:** asignar plan a cliente y notificar (in-app + email) cuando un plan activo cambia.

### B7.1 Interfaces Observer
- [ ] Crear `planes-entrenamiento/observers/subject.interface.ts` con `Observer.update(evento)` y `Subject.subscribe/unsubscribe/notify`.
- [ ] Definir `EventoPlan = { tipo: 'PLAN_ACTIVADO' | 'PLAN_MODIFICADO' | 'PLAN_ARCHIVADO'; planId; clienteId }`.

### B7.2 `PlanSubject`
- [ ] Crear servicio `plan-subject.service.ts` (singleton NestJS) con `Map<planId, Set<Observer>>`.
- [ ] Implementar `notify(planId, evento)` que itera observers.

### B7.3 Observers concretos
- [ ] Crear `cliente.observer.ts` que recibe `prisma` y persiste fila en `Notificacion`.
- [ ] Crear `email-notification.observer.ts` que recibe `mailer` y envía email con `cambio-plan.hbs`.
- [ ] Crear template `mailer/templates/cambio-plan.hbs`.

### B7.4 `AsignacionesService`
- [ ] Implementar `asignarEntrenamiento({ clienteId, planEntrenamientoId })`.
- [ ] Validar cliente y plan en mismo workspace.
- [ ] Validar plan estado = ACTIVO.
- [ ] Crear `AsignacionPlanEntrenamiento(estado=ACTIVO)`.
- [ ] Suscribir `ClienteObserver(clienteId)` y `EmailObserver(correoCliente)` al `PlanSubject` para ese `planId`.
- [ ] Implementar `cambiarEstado(asignacionId, estado)`.

### B7.5 Disparo desde §B6
- [ ] En `activar()`: tras persistir, `subject.notify({ tipo: 'PLAN_ACTIVADO' })`.
- [ ] En `agregarEjercicio`/`quitarEjercicio` con plan ACTIVO: `subject.notify({ tipo: 'PLAN_MODIFICADO' })`.
- [ ] En `archivar()`: `subject.notify({ tipo: 'PLAN_ARCHIVADO' })`.

### B7.6 Controller asignaciones
- [ ] `POST /api/asignaciones/entrenamiento`.
- [ ] `GET /api/clientes/:id/asignaciones`.
- [ ] `PUT /api/asignaciones/:id` body `{ estado }`.

### B7.7 Endpoint notificaciones
- [ ] `GET /api/notificaciones` (CLIENTE) — lista no leídas.
- [ ] `PATCH /api/notificaciones/:id/leer`.

### B7.8 Tests
- [ ] `plan-subject.spec.ts`: subscribe/unsubscribe/notify llaman a observers correctos.
- [ ] `cliente.observer.spec.ts`: persiste notificación con mensaje según evento.
- [ ] `email-notification.observer.spec.ts`: invoca mailer con el template correcto.

---

## Fase B8 — Registros + Builder + ArchivarPlanCommand

**Objetivo:** registrar entrenamientos vía Builder y completar el tercer command (archivar plan con undo).

### B8.1 `RegistroEntrenamientoBuilder`
- [ ] Crear `registros/builders/registro-entrenamiento.builder.ts`.
- [ ] Setters: `setFecha`, `setClienteId`, `addEjercicio`, `setNotas`, `setDuracionMin`.
- [ ] `build()` valida que haya `fecha`, `clienteId` y al menos 1 ejercicio; si no, lanza error.
- [ ] `build()` devuelve copia inmutable.

### B8.2 `RegistrosService`
- [ ] Validar que cliente pertenece al workspace.
- [ ] Instanciar builder y aplicar setters iterando el DTO.
- [ ] `build()` y persistir `RegistroDeEntrenamiento` + `RegistroDeEjercicio[]` en transacción.
- [ ] Implementar `listar(clienteId, { page, limit, desde, hasta })`.

### B8.3 Controller
- [ ] `POST /api/clientes/:id/registros-entrenamiento`.
- [ ] `GET /api/clientes/:id/registros-entrenamiento` con paginación.

### B8.4 `ArchivarPlanCommand`
- [ ] Constructor recibe `planesService`, `planId`, `workspaceId`.
- [ ] `execute()`: guarda `estadoPrevio` y llama `archivar()`.
- [ ] `undo()`: si `estadoPrevio === ACTIVO`, llama `activar()`.

### B8.5 Endpoint
- [ ] `PATCH /api/planes-entrenamiento/:id/archivar` pasa por `CommandInvoker`.

### B8.6 Tests
- [ ] `registro-entrenamiento.builder.spec.ts`: build sin ejercicios falla.
- [ ] `registro-entrenamiento.builder.spec.ts`: build con ejercicios construye objeto correcto.
- [ ] `archivar-plan.command.spec.ts`: execute archiva; undo restaura estado previo.

---

## Fase B9 — Progreso + Strategy

**Objetivo:** tres estrategias intercambiables seleccionables por query param.

### B9.1 Interfaz y tipos
- [ ] Crear `progreso/strategies/progreso-strategy.interface.ts` con `calcular(registros): ProgresoResumen`.
- [ ] Definir `ProgresoResumen` y `PeriodoResumen`.

### B9.2 Estrategias concretas
- [ ] Crear `progreso-semanal.strategy.ts` agrupando por ISO week.
- [ ] Crear `progreso-mensual.strategy.ts` agrupando por `YYYY-MM`.
- [ ] Crear `progreso-por-plan.strategy.ts` agrupando por plan asignado vigente.

### B9.3 `ProgresoContext` / Service
- [ ] Crear `progreso/progreso.service.ts`.
- [ ] Implementar `setEstrategia(s)`.
- [ ] Implementar `calcularProgreso(clienteId, workspaceId, vista)` que carga registros con detalle y delega.

### B9.4 Endpoint
- [ ] `GET /api/clientes/:id/progreso?vista=semanal|mensual|porPlan` (default `semanal`).
- [ ] Validar `vista` con `@IsIn(['semanal','mensual','porPlan'])` en query DTO.

### B9.5 Tests
- [ ] `progreso-semanal.strategy.spec.ts` con dataset fijo en memoria.
- [ ] `progreso-mensual.strategy.spec.ts` con dataset fijo en memoria.
- [ ] `progreso-por-plan.strategy.spec.ts` con dataset fijo en memoria.
- [ ] `progreso.service.spec.ts`: selecciona la strategy correcta según query.

---

## Fase B10 — Dashboard + Facade

**Objetivo:** un único endpoint que el frontend consume para la pantalla principal del cliente.

### B10.1 `ClienteDashboardFacade`
- [ ] Crear `dashboard/cliente-dashboard.facade.ts`.
- [ ] Inyectar `ClientesService`, `PlanesEntrenamientoService`, `RegistrosService`, `ProgresoService`.
- [ ] Implementar `getDashboardCliente(clienteId, workspaceId)`.
- [ ] Componer: cliente + plan activo + últimos 5 registros + resumen semanal.

### B10.2 Endpoint
- [ ] `GET /api/clientes/:id/dashboard` (ENTRENADOR).

### B10.3 Tests
- [ ] `cliente-dashboard.facade.spec.ts` con servicios mockeados: verifica composición y orden de llamadas.

---

## Fase B11 — Tests unitarios consolidados + e2e happy path

**Objetivo:** cobertura mínima de los patrones y un e2e que recorra el flujo completo.

### B11.1 Configuración Jest e2e
- [ ] Confirmar/ajustar `apps/api/test/jest-e2e.json`.
- [ ] Agregar variable `DATABASE_URL_TEST` apuntando a esquema/DB de test.
- [ ] Crear `globalSetup` que ejecute `prisma migrate deploy` sobre la DB de test.
- [ ] Agregar script `pnpm --filter api test:e2e`.

### B11.2 Helpers de test
- [ ] Crear `apps/api/test/helpers/db.ts` con `truncateAll(prisma)`.
- [ ] Crear `apps/api/test/helpers/auth.ts` con `registrarEntrenadorYLogin(app)` y `crearClientePorInvitacion(app, token)`.

### B11.3 e2e happy path (`happy-path.e2e-spec.ts`)
- [ ] Paso 1 — `POST /auth/register` entrenador y guardar `tokenEntrenador`.
- [ ] Paso 2 — `POST /clientes/invitar` con `correo=cli@test` y capturar `tokenInvitacion`.
- [ ] Paso 3 — `POST /auth/cliente/register` con ese token y guardar `tokenCliente`.
- [ ] Paso 4 — `POST /ejercicios` ×3; segunda llamada a `GET /ejercicios` no consulta Prisma (Decorator).
- [ ] Paso 5 — `POST /planes-entrenamiento` con `tipo=HIPERTROFIA`; verificar defaults de la factory.
- [ ] Paso 6 — `POST /planes-entrenamiento/:id/ejercicios` ×2.
- [ ] Paso 7 — `PATCH /planes-entrenamiento/:id/activar` (State transition).
- [ ] Paso 8 — `POST /asignaciones/entrenamiento`.
- [ ] Paso 9 — `GET /notificaciones` con `tokenCliente` debe devolver ≥1 (Observer).
- [ ] Paso 10 — `POST /clientes/:id/registros-entrenamiento` con 2 ejercicios (Builder).
- [ ] Paso 11 — `GET /clientes/:id/dashboard` y verificar shape (Facade).
- [ ] Paso 12 — `GET /clientes/:id/progreso?vista=semanal` con `periodos.length >= 1` (Strategy).
- [ ] Paso 13 — `POST /planes-entrenamiento/:id/duplicar`; verificar nuevo id y sufijo `(copia)` (Prototype).
- [ ] Paso 14 — `DELETE /clientes/:id`; cliente queda `estaActivo=false` (Command + Memento).
- [ ] Paso 15 — `POST /commands/undo`; cliente vuelve a `estaActivo=true`.

### B11.4 Cobertura mínima
- [ ] Cada patrón tiene al menos un `.spec.ts` ya escrito en fases anteriores.
- [ ] Generar reporte con `pnpm --filter api test --coverage`.
- [ ] Verificar >80% líneas en los archivos de patrones.

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
