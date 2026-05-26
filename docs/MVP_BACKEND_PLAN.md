# Plan Backend MVP — Fitness SaaS (NestJS)

Plan atomizado por fases para el backend. Cada paso es una unidad de trabajo independiente que termina con código compilando y, cuando aplica, con un test en verde o un endpoint respondiendo 200.

Referencias cruzadas: `MVP_FRONTEND_PLAN.md`, `deep-dive-patterns.md`, `design-patterns.md`, `poster.pdf`, `system_design_analysis.md`.

---

## 0. Convenciones

- [ ] Trabajar todo bajo `apps/api/`.
- [ ] Cada módulo cuelga de `apps/api/src/modules/<nombre>/`.
- [ ] Estructura por módulo: `controllers/`, `services/`, `repositories/`, `dtos/`, y subcarpeta del patrón (`factories/`, `builders/`, `states/`, `strategies/`, `observers/`, `decorators/`, `prototypes/`, `memento/`, `commands/`).
- [ ] Validación con `class-validator` + `class-transformer` y `ValidationPipe` global.
- [ ] Shape de respuestas: `{ data: ... }` para éxito; filtro global de excepciones para `{ statusCode, mensaje, error }`.
- [ ] Prefijo global de rutas: `/api`.
- [ ] **Repository Pattern obligatorio**: el `PrismaService` solo se inyecta en repositorios. Servicios, commands, observers, facades, strategies, factories y states consumen repositorios, nunca Prisma directo.
- [ ] Cerrar cada fase con commit `feat(api): <fase> — <resumen>`.

---

## 0.1 Repository Pattern (regla transversal)

**Regla:** ninguna capa del backend, excepto los repositorios, puede importar `PrismaService` ni `@prisma/client` para hacer queries. Los repositorios son la **única** frontera con la base de datos.

### Responsabilidades

- [ ] **Repositorio:** encapsula todas las operaciones de persistencia de una entidad (queries, inserts, updates, deletes, transacciones que sólo tocan esa entidad). Devuelve entidades de dominio tipadas, no objetos `Prisma.*`.
- [ ] **Servicio:** orquesta lógica de negocio, valida invariantes y compone llamadas a uno o varios repositorios. No conoce Prisma.
- [ ] **Command / Observer / Facade / Strategy / Factory / State:** dependen de servicios o repositorios, nunca de Prisma.
- [ ] **Transacciones cross-entidad:** se encapsulan en un método de servicio que delega a un repositorio "coordinador" (ej. `UsuariosRepository.crearConEntrenadorYWorkspace`) que recibe la transacción Prisma y la pasa a los demás repos a través de `withTx(tx)`. Solo el repositorio acepta `tx` como parámetro.

### Estructura por módulo

```
modules/<nombre>/
├── repositories/
│   └── <entidad>.repository.ts        # @Injectable, depende de PrismaService
├── services/
│   └── <entidad>.service.ts           # @Injectable, depende del Repository
├── controllers/
└── (subcarpetas de patrones)
```

### Convención de interfaces

- [ ] Por cada repositorio crear interfaz `<Entidad>RepositoryInterface` en el mismo archivo o en `repositories/<entidad>.repository.interface.ts`.
- [ ] Registrar el repositorio con `provide: '<ENTIDAD>_REPOSITORY'` cuando otro módulo necesite inyectarlo a través de la interfaz (facilita mockeo en tests).

### Repositorios del MVP (uno por entidad)

- [ ] `UsuariosRepository`
- [ ] `EntrenadoresRepository`
- [ ] `EspaciosDeTrabajoRepository`
- [ ] `ClientesRepository`
- [ ] `InvitacionesRepository`
- [ ] `EjerciciosRepository`
- [ ] `PlanesEntrenamientoRepository` (incluye operaciones sobre `EjercicioPlan`)
- [ ] `AsignacionesEntrenamientoRepository`
- [ ] `RegistrosEntrenamientoRepository` (incluye `RegistroDeEjercicio`)
- [ ] `NotificacionesRepository`

### Tests

- [ ] Los tests unitarios de servicios/commands/observers mockean **repositorios**, no Prisma.
- [ ] Los tests de repositorios pueden mockear `PrismaService` o usar una DB de test.

---

## Fase B0 — Limpieza del schema y baseline de infra

**Objetivo:** repo listo para construir encima, con schema mínimo y `.env` cargado.

### B0.1 Limpiar `packages/database/prisma/schema.prisma`
- [x] Eliminar modelo `PerfilDelCliente`.
- [x] Eliminar modelo `PlanDeNutricion`.
- [x] Eliminar modelo `Comida`.
- [x] Eliminar modelo `AsignacionPlanNutricion`.
- [x] Eliminar modelo `RegistroDeNutricion`.
- [x] Eliminar modelo `RegistroBiometrico`.
- [x] Eliminar modelo `RefreshToken`.
- [x] Eliminar las relaciones a esos modelos en `Cliente`, `Entrenador` y `Usuario`.
- [x] Verificar que queden únicamente: `EspacioDeTrabajo`, `Usuario`, `Entrenador`, `Cliente`, `Invitacion`, `Ejercicio`, `PlanDeEntrenamiento`, `EjercicioPlan`, `AsignacionPlanEntrenamiento`, `RegistroDeEntrenamiento`, `RegistroDeEjercicio`.

### B0.2 Agregar enum y modelo nuevos
- [x] Agregar enum `TipoPlanEntrenamiento { HIPERTROFIA FUERZA RESISTENCIA }`.
- [x] Agregar campo `tipo TipoPlanEntrenamiento` en `PlanDeEntrenamiento` (no opcional, sin default).
- [x] Agregar modelo `Notificacion(id, clienteId, mensaje, leida, creadoEn)` con relación a `Cliente` (onDelete: Cascade) e índice `[clienteId, leida]`.
- [x] Agregar relación `notificaciones Notificacion[]` en `Cliente`.

### B0.3 Migración baseline
- [x] Borrar carpeta `packages/database/prisma/migrations/` si existe (sin datos en prod).
- [x] Ejecutar `pnpm --filter @repo/database prisma migrate dev --name mvp_baseline`.
- [x] Verificar generación de `node_modules/.prisma/client`.
- [x] Verificar que `docker compose up -d` levanta Postgres y la migración corre limpia.

### B0.4 Variables de entorno del API
- [x] Crear `apps/api/.env` con `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=2h`, `MAILTRAP_HOST`, `MAILTRAP_PORT`, `MAILTRAP_USER`, `MAILTRAP_PASS`, `MAILTRAP_FROM`, `APP_URL`.
- [x] Crear `apps/api/.env.example` con las mismas claves vacías.
- [ ] Commitear `.env.example`.
- [x] Confirmar que `.env` está en `.gitignore`.

### B0.5 ConfigModule
- [x] Instalar `@nestjs/config`.
- [x] Registrar `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })` en `AppModule`.
- [x] Crear `apps/api/src/config/env.validation.ts` validando variables con `class-validator`.
- [x] Conectar `validate` del `ConfigModule` al validador.

### B0.6 Pipes, filtros y prefix global
- [x] En `main.ts`: `app.setGlobalPrefix('api')`.
- [x] En `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.
- [x] Crear `apps/api/src/common/filters/http-exception.filter.ts` y registrarlo global.
- [x] Habilitar CORS limitado a `APP_URL`.

### B0.7 Smoke test
- [x] Crear `HealthController` con `GET /api/health` → `{ ok: true }`.
- [x] Levantar con `pnpm --filter api dev`.
- [x] Probar `curl localhost:4000/api/health` y confirmar 200.

---

## Fase B1 — Autenticación (JWT + bcrypt)

**Objetivo:** registro y login funcionando; JWT con `{ sub, rol, workspaceId }`; guards listos.

### B1.1 Dependencias
- [x] `pnpm --filter api add bcryptjs @nestjs/jwt`.
- [x] `pnpm --filter api add -D @types/bcryptjs`.
- [x] `pnpm --filter api add @nestjs/passport passport passport-jwt` (decisión técnica — ver B1.4).
- [x] `pnpm --filter api add -D @types/passport-jwt`.

### B1.2 Repositorios base (regla §0.1)
- [x] Crear `modules/usuarios/repositories/usuarios.repository.ts` con `findByCorreo`, `findById`, `crear(tx?)`.
- [x] Crear `modules/entrenadores/repositories/entrenadores.repository.ts` con `findByUsuarioId`, `crear(tx?)`.
- [x] Crear `modules/espacios-de-trabajo/repositories/espacios-de-trabajo.repository.ts` con `findById`, `findBySlug`, `crear(tx?)`.
- [x] Crear `modules/clientes/repositories/clientes.repository.ts` con `findByUsuarioId`, `crear(tx?)` (resto en §B5).
- [x] Crear `modules/invitaciones/repositories/invitaciones.repository.ts` con `findByToken`, `marcarConsumida(tx?)`.
- [x] Cada repositorio acepta opcionalmente un `Prisma.TransactionClient` en métodos de escritura (`withTx`).
- [x] Confirmar que `PrismaService` se inyecta **solo** en estos repositorios.

### B1.3 Módulo `auth`
- [x] Crear `apps/api/src/modules/auth/`.
- [x] Crear `AuthService` con `registrarEntrenador`, `login`, `registrarCliente` que depende de `UsuariosRepository`, `EntrenadoresRepository`, `EspaciosDeTrabajoRepository`, `ClientesRepository`, `InvitacionesRepository`.
- [x] La transacción de registro se abre desde el servicio vía `prisma.$transaction` accedido **solo** a través de un método helper en `UsuariosRepository.conTransaccion(callback)` para no inyectar Prisma en el service.
- [x] Registrar `JwtModule.registerAsync` leyendo secret/expires del `ConfigService`.

### B1.4 Guards y decoradores comunes
- [x] Crear `common/guards/jwt-auth.guard.ts` que valida `Authorization: Bearer` y adjunta `req.user = { id, rol, workspaceId }`.
- [x] Crear `common/guards/workspace.guard.ts` que valida ownership del recurso vs `req.user.workspaceId`.
- [x] Crear decorador `common/decorators/current-user.decorator.ts`.
- [x] Crear decorador `common/decorators/current-workspace.decorator.ts`.
- [x] Crear `common/decorators/roles.decorator.ts` + `common/guards/roles.guard.ts`.

**Decisión técnica — flujo JWT con `passport-jwt`:** la extracción y verificación del Bearer token se delega a `@nestjs/passport` + `passport-jwt`. El payload del JWT (`{ sub, rol, workspaceId }`) se mapea en `JwtStrategy.validate()` al objeto `AuthenticatedUser` que Passport pega automáticamente en `req.user`. `JwtAuthGuard` queda reducido a `extends AuthGuard('jwt')`. Motivación: reusar una implementación probada (manejo de expiración, errores estándar, integración con el ecosistema) en vez de mantener la extracción/verificación manualmente.

- [x] Crear `modules/auth/strategies/jwt.strategy.ts` extendiendo `PassportStrategy(Strategy, 'jwt')` con `ExtractJwt.fromAuthHeaderAsBearerToken()` y secret del `ConfigService`.
- [x] Reducir `JwtAuthGuard` a `extends AuthGuard('jwt')`.
- [x] Registrar `PassportModule.register({ defaultStrategy: 'jwt' })` y `JwtStrategy` como provider en `AuthModule`.

### B1.5 Endpoint registro entrenador
- [x] DTO `RegisterEntrenadorDto` con `correo`, `contrasena`, `nombre`, `apellido`, `nombreWorkspace`.
- [x] Abrir transacción vía `UsuariosRepository.conTransaccion(tx => ...)`; dentro: `usuariosRepository.crear(tx, ...)`, `espaciosDeTrabajoRepository.crear(tx, ...)` (slug = slugify), `entrenadoresRepository.crear(tx, ...)`.
- [x] Devolver `{ token, usuario }`.
- [x] Probar con `curl` o REST client.

### B1.6 Endpoint login
- [x] DTO `LoginDto` con `correo`, `contrasena`.
- [x] Resolver usuario con `usuariosRepository.findByCorreo`.
- [x] Validar con `bcrypt.compare`.
- [x] Resolver `workspaceId` según rol (ENTRENADOR vía `entrenadoresRepository.findByUsuarioId`, CLIENTE vía `clientesRepository.findByUsuarioId`).
- [x] Firmar JWT y devolver `{ token, usuario }`.

### B1.7 Endpoint registro cliente vía invitación
- [x] DTO `RegistrarClienteDto` con `tokenInvitacion`, `correo`, `contrasena`, `nombre`, `apellido`.
- [x] Validar invitación con `invitacionesRepository.findByToken`: existe, no consumida, no expirada, correo coincide.
- [x] Transacción: `usuariosRepository.crear(tx)` (rol=CLIENTE), `clientesRepository.crear(tx)`, `invitacionesRepository.marcarConsumida(tx, token)`.
- [x] Devolver `{ token, cliente }`.

### B1.8 Validación con DTOs
- [x] Aplicar `@IsEmail`, `@MinLength`, `@IsString` en los tres DTOs.
- [x] Confirmar que envíos inválidos retornan 400 con detalle.

---

## Fase B2 — Singleton: WorkspaceRegistry y EjerciciosCatalog

**Objetivo:** dos clases con `getInstance()` explícito (no NestJS singleton implícito) consumidas por el resto del sistema.

**Decisiones técnicas B2.1-B2.2:**

- Se implementan como clases puras con constructor `private` y `static getInstance()` para representar explícitamente el patrón Singleton del MVP. No se usan providers singleton de NestJS porque el objetivo académico/técnico de esta fase es que el patrón sea visible en código y no dependa del ciclo de vida del contenedor.
- Ambos singletons mantienen estado en memoria con `Map` indexado por `id`. Esta estructura da búsquedas directas O(1), encaja con el uso esperado de catálogos/registries y evita recorrer listas para operaciones frecuentes como validar un workspace o filtrar datos ya cargados.
- Los métodos devuelven copias superficiales (`{ ...entidad }`) para no exponer referencias mutables al estado interno. Así, controllers, guards o servicios futuros no podrán modificar accidentalmente el contenido del registry/catalog sin pasar por los métodos definidos.
- `WorkspaceRegistry` guarda solo `{ id, slug, nombre }` porque su uso futuro está enfocado en identificación y validación de tenancy, no en reemplazar el repositorio de `EspacioDeTrabajo`. En B2.4, `WorkspaceGuard` lo consultará primero para validar el `workspaceId` del JWT; si no existe en memoria, hará fallback al repositorio y registrará el workspace encontrado.
- `EjerciciosCatalog` depende de una interfaz mínima `EjerciciosCatalogSource` con `findAll()`. Esto permite cargar datos desde `EjerciciosRepository` en B2.3/B3 sin importar `PrismaService` ni hacer queries dentro del Singleton, preservando la regla transversal del Repository Pattern.
- `EjerciciosCatalog` se usará como catálogo global de ejercicios para bootstrap y consultas por `GrupoMuscular`. En B2.3 se cargará al iniciar la API; en B3 convivirá con `EjerciciosRepository`, `EjerciciosServiceImpl` y `CacheEjerciciosDecorator`: el catálogo sirve como lectura global precargada, mientras el decorador cachea respuestas del servicio y se invalida cuando se creen ejercicios nuevos.
- Estos singletons no son fuente permanente de verdad. La base de datos sigue siendo la autoridad; los registries son optimizaciones y puntos de integración para guards, bootstrap y consultas repetidas. Si se actualizan workspaces o ejercicios en runtime, el módulo responsable deberá registrar/recargar explícitamente el dato afectado.

**Decisiones técnicas B2.3-B2.4:**

- `EjerciciosModule` y `EjerciciosRepository.findAll()` se crean en B2.3 con alcance mínimo para que `main.ts` pueda resolver un provider real desde Nest y cargar `EjerciciosCatalog` antes de `app.listen`. No se adelantan endpoints, servicios ni decoradores de B3; esos quedan para la fase de ejercicios.
- La carga inicial del catálogo ocurre en `bootstrap()` porque depende del contenedor de Nest ya inicializado y debe completarse antes de aceptar tráfico. Así, las futuras lecturas del catálogo parten de un estado precargado desde la base de datos.
- `EjerciciosRepository` encapsula la query a Prisma y `EjerciciosCatalog` recibe solo una fuente con `findAll()`. De esa forma, el Singleton no conoce Prisma, se mantiene la regla del Repository Pattern y el catálogo puede probarse con un mock simple en B2.5.
- En `WorkspaceGuard`, `WorkspaceRegistry` se consulta apenas se extrae `workspaceId` del JWT. Si el workspace ya está en memoria, el guard evita una consulta repetida a base de datos; si no está, usa `EspaciosDeTrabajoRepository.findById()` como fallback y registra `{ id, slug, nombre }`.
- La integración del registry se ubica antes de resolver ownership del recurso. Esto valida primero que el workspace del usuario exista y deja el registry caliente para el resto de validaciones y solicitudes posteriores.
- El acceso a `EspaciosDeTrabajoRepository` usa `ModuleRef`, consistente con el diseño actual del guard para resolver dependencias dinámicas (`WorkspaceOwnershipResolver`). Esto evita acoplar el constructor del guard a cada repositorio y mantiene extensible el mecanismo de ownership por recurso.
- Si el `workspaceId` del JWT no existe en DB, el guard responde `ForbiddenException`. Ese caso representa un token válido en forma pero inválido respecto al estado actual del sistema, por ejemplo un workspace eliminado o inconsistente.
- A futuro, los módulos que creen o modifiquen workspaces deberán registrar o refrescar `WorkspaceRegistry`. Los módulos que creen ejercicios deberán recargar `EjerciciosCatalog` o coordinar la invalidación con `CacheEjerciciosDecorator`, para mantener coherencia entre DB, catálogo y cache.

### B2.1 `WorkspaceRegistry`
- [x] Crear `apps/api/src/modules/registry/workspace.registry.ts`.
- [x] Definir `private static instance` y `static getInstance()`.
- [x] Mantener `Map<string, { id, slug, nombre }>`.
- [x] Implementar `registrar(ws)`, `buscar(id)`, `listar()`.

### B2.2 `EjerciciosCatalog`
- [x] Crear `apps/api/src/modules/registry/ejercicios.catalog.ts`.
- [x] Aplicar mismo patrón Singleton.
- [x] Mantener `Map<string, Ejercicio>`.
- [x] Implementar `cargarDesde(ejerciciosRepository)`, `buscarPorGrupo(grupo)`, `obtenerTodos()` (sin tocar Prisma directamente).

### B2.3 Bootstrap del catálogo
- [x] En `main.ts` antes de `app.listen`, resolver `EjerciciosRepository` del contenedor Nest y llamar `await EjerciciosCatalog.getInstance().cargarDesde(ejerciciosRepository)`.

### B2.4 Integración con `WorkspaceGuard`
- [x] En el guard, consultar primero `WorkspaceRegistry.getInstance().buscar(workspaceId)`.
- [x] Fallback a DB y registrar si no estaba.

### B2.5 Tests
- [x] `workspace.registry.spec.ts`: `getInstance()` retorna misma referencia.
- [x] `workspace.registry.spec.ts`: registrar + buscar funcionan.
- [x] `ejercicios.catalog.spec.ts`: `getInstance()` retorna misma referencia.
- [x] `ejercicios.catalog.spec.ts`: `cargarDesde` puebla el mapa.

---

## Fase B3 — Ejercicios + Decorator (cache)

**Objetivo:** módulo con `CacheEjerciciosDecorator` envolviendo al impl base, transparente para los controllers.

### B3.1 Repositorio
- [x] Crear `ejercicios/repositories/ejercicios.repository.ts` con `findAll()`, `findById(id)`, `findByGrupo(grupo)`, `crear(dto)`.
- [x] `PrismaService` inyectado **solo aquí** para el dominio de ejercicios.

### B3.2 Interfaz de servicio y DTOs
- [x] Crear `ejercicios/interfaces/ejercicios-service.interface.ts` con `findAll`, `findById`, `findByGrupo`, `create`.
- [x] DTO `CrearEjercicioDto` con `@IsEnum(GrupoMuscular)`.

### B3.3 `EjerciciosServiceImpl`
- [x] Implementar la interfaz consumiendo `EjerciciosRepository` (no Prisma).

### B3.4 `BaseDecorator`
- [x] Crear `ejercicios/decorators/base.decorator.ts` que recibe `service: EjerciciosServiceInterface` y delega cada método.

### B3.5 `CacheEjerciciosDecorator`
- [x] Extender `BaseDecorator`.
- [x] Mantener `private cache = new Map<string, any>()`.
- [x] Cachear `findAll` con clave `'all'`.
- [x] Cachear `findById(id)` con clave `id:<id>`.
- [x] Cachear `findByGrupo(g)` con clave `grupo:<g>`.
- [x] Implementar `invalidate(key)` y `flush()`.
- [x] En `create(dto)`: delegar al inner service y luego `this.flush()`.

### B3.6 Provider compuesto
- [x] En `EjerciciosModule`, registrar `EjerciciosRepository` y `EjerciciosServiceImpl` como providers.
- [x] Registrar `{ provide: 'EJERCICIOS_SERVICE', useFactory: (impl) => new CacheEjerciciosDecorator(impl), inject: [EjerciciosServiceImpl] }`.
- [x] Inyectar `@Inject('EJERCICIOS_SERVICE')` en el controller.

### B3.7 Endpoints
- [x] `GET /api/ejercicios`.
- [x] `GET /api/ejercicios/:id`.
- [x] `GET /api/ejercicios/por-grupo/:grupoMuscular`.
- [x] `POST /api/ejercicios` (solo ENTRENADOR).

### B3.8 Tests
- [x] `ejercicios.repository.spec.ts` con `PrismaService` mockeado: cada método llama al modelo correcto.
- [x] `cache-ejercicios.decorator.spec.ts`: dos llamadas a `findAll()` invocan al impl una sola vez.
- [x] `cache-ejercicios.decorator.spec.ts`: `create()` invalida cache.

---

## Fase B4 — Mailer y Command base + InvitarClienteCommand

**Objetivo:** mailer Mailtrap funcional, infraestructura Command lista, primer command end-to-end.

### B4.1 Dependencias
- [x] `pnpm --filter api add nodemailer handlebars`.
- [x] `pnpm --filter api add -D @types/nodemailer`.

### B4.2 `MailerService`
- [x] Crear `apps/api/src/modules/mailer/mailer.service.ts`.
- [x] Leer credenciales Mailtrap desde `ConfigService` y crear `nodemailer.createTransport`.
- [x] Implementar `enviarInvitacion(correo, token)` que compila `templates/invitacion.hbs` con `{ urlInvitacion, anioActual }`.

### B4.3 Template Handlebars
- [x] Crear `mailer/templates/invitacion.hbs` con saludo, botón con `urlInvitacion` y footer.
- [x] Verificar que carga vía `fs.readFile` desde el dist.

### B4.4 Interfaz `Command` y `CommandInvoker`
- [x] Crear `commands/command.interface.ts` con `execute(): Promise<T>`, `undo(): Promise<void>`, `descripcion(): string`.
- [x] Crear `commands/command-invoker.service.ts` con `historial: Command[]` (máx. 50).
- [x] Implementar `ejecutar(cmd)`, `deshacerUltimo()`, `getHistorial()`.
- [x] Revisar alineación con diagrama de clases de `docs/poster.pdf`: `CommandInvoker` mantiene `historial: Command[]`, expone `ejecutar(cmd)`, alias `deshacer()` y `deshacerUltimo()`, y `getHistorial()` devuelve la lista de commands.

### B4.5 `InvitarClienteCommand`
- [x] Extender `InvitacionesRepository` con `crear(dto)` y `marcarConsumidaPorId(id)`.
- [x] Constructor del command recibe `invitacionesRepository`, `mailer`, `workspaceId`, `correo` (sin Prisma).
- [x] `execute()`: genera token uuid, llama `invitacionesRepository.crear({ ... expiraEn = now + 24h })`, envía email.
- [x] Guardar `this.invitacionId` para el undo.
- [x] `undo()`: `invitacionesRepository.marcarConsumidaPorId(this.invitacionId)`.
- [x] Implementación alineada con `docs/poster.pdf`: clase concreta `InvitarClienteCommand` implementa `Command`, encapsula `clienteId/correo` y `token`, y expone `execute()`/`undo()` para ser ejecutada por `CommandInvoker`.

### B4.6 Endpoints
- [x] `POST /api/clientes/invitar` body `{ correo }`.
- [x] `GET /api/invitaciones/:token/verificar`.
- [x] `POST /api/commands/undo`.

### B4.7 Tests
- [x] `invitar-cliente.command.spec.ts`: `execute` crea invitación y llama mailer.
- [x] `invitar-cliente.command.spec.ts`: `undo` marca consumida.
- [x] `command-invoker.service.spec.ts`: ejecutar 3 commands → undo del último deshace solo ese.

---

## Fase B5 — Clientes + Memento + DesactivarClienteCommand

**Objetivo:** CRUD de clientes con soft-delete reversible mediante memento.

### B5.1 `ClienteMemento` y `ClienteContainer`
- [x] Crear `clientes/memento/cliente.memento.ts` con `estado`, `timestamp`, `getEstado()`, `getTimestamp()`.
- [x] Tipar `ClienteSnapshot` como subset serializable del cliente.
- [x] Crear `clientes/memento/cliente-container.ts` con `mementos: Map<string, ClienteMemento[]>`.
- [x] Implementar `guardar(clienteId, snapshot)`, `restaurarUltimo(clienteId)`.

### B5.2 Extender `ClientesRepository`
- [x] Añadir métodos `findAllPorWorkspace(workspaceId)`, `findByIdConPerfil(id)`, `update(id, dto)`, `setActivo(id, valor)`.
- [x] Garantizar que todas las queries filtren por `espacioDeTrabajoId` cuando se reciba.

### B5.3 `ClientesService`
- [x] Inyectar `ClientesRepository` y `ClienteContainer`.
- [x] Implementar `findAllPorWorkspace(workspaceId)` → `repo.findAllPorWorkspace`.
- [x] Implementar `findById(id, workspaceId)` → `repo.findByIdConPerfil` + check de workspace.
- [x] Implementar `update(id, dto, workspaceId)` → `repo.update`.
- [x] Implementar `softDelete(id, workspaceId)`: snapshot → `container.guardar` → `repo.setActivo(id, false)`.
- [x] Implementar `restaurar(id, workspaceId)`: `container.restaurarUltimo` → `repo.setActivo(id, true)`.

### B5.4 `DesactivarClienteCommand`
- [x] Constructor recibe `clientesService`, `clienteId`, `workspaceId`.
- [x] `execute()`: llama `clientesService.softDelete` y guarda `this.clienteId`.
- [x] `undo()`: llama `clientesService.restaurar`.

### B5.5 Controller
- [x] `GET /api/clientes` (ENTRENADOR).
- [x] `GET /api/clientes/:id`.
- [x] `PUT /api/clientes/:id`.
- [x] `DELETE /api/clientes/:id` → pasa por `CommandInvoker`.
- [x] `POST /api/clientes/:id/restaurar` (atajo directo).

### B5.6 Tests
- [x] `clientes.repository.spec.ts` con `PrismaService` mockeado.
- [x] `cliente.memento.spec.ts`: snapshot inmutable, timestamp correcto.
- [x] `cliente-container.spec.ts`: guardar 2 mementos → restaurar último.
- [x] `desactivar-cliente.command.spec.ts` mockeando `ClientesService`: execute desactiva; undo reactiva.

---

## Fase B6 — Planes: Factory + State + Prototype

**Objetivo:** módulo más cargado de patrones del MVP. Tres patrones colaborando en la misma entidad.

### B6.0 `PlanesEntrenamientoRepository`
- [x] Crear `planes-entrenamiento/repositories/planes-entrenamiento.repository.ts`.
- [x] Métodos: `crear(plan)`, `findAllPorWorkspace(workspaceId)`, `findByIdConEjercicios(id)`, `updateEstado(id, estado)`, `agregarEjercicioPlan(planId, dto)`, `quitarEjercicioPlan(ejercicioPlanId)`, `contarEjercicios(planId)`, `crearDesdeClone(snapshot)`.
- [x] `PrismaService` inyectado **solo aquí** para este dominio.
- [x] States y prototype reciben este repositorio cuando necesiten persistir.

### B6.1 Factories
- [x] Crear `planes-entrenamiento/factories/plan.factory.ts` (clase abstracta con `crear(dto): PlanDraft`).
- [x] Crear `hipertrofia.factory.ts` (series=4, reps=10, descanso=60s).
- [x] Crear `fuerza.factory.ts` (series=5, reps=5, descanso=180s).
- [x] Crear `resistencia.factory.ts` (series=3, reps=15, descanso=30s).
- [x] Crear `plan-factory.provider.ts` con mapa `Record<TipoPlanEntrenamiento, PlanFactory>` inyectable.

### B6.2 States
- [x] Crear `planes-entrenamiento/states/plan-state.interface.ts` con `activar(plan, ctx)` y `archivar(plan, ctx)` donde `ctx = { repository, subject }`.
- [x] Crear `borrador.state.ts`: `activar` valida `repository.contarEjercicios(plan.id) >= 1`, llama `repository.updateEstado(plan.id, 'ACTIVO')`, dispara observers, retorna `ActivoState`.
- [x] `borrador.state.ts`: `archivar` lanza BadRequest.
- [x] Crear `activo.state.ts`: `archivar` llama `repository.updateEstado(plan.id, 'ARCHIVADO')`; `activar` lanza BadRequest.
- [x] Crear `archivado.state.ts`: ambos lanzan BadRequest.
- [x] Crear `state.factory.ts` con `fromEstado(estado): PlanState`.
- [x] Confirmar que ningún state importa `PrismaService`.

### B6.3 Prototype
- [x] Crear `planes-entrenamiento/prototypes/plan.prototype.ts` con interfaz `Cloneable<T>`.
- [x] Implementar `PlanDeEntrenamientoPrototype.clone()` con ids `undefined` y nombre `<original> (copia)`.

### B6.4 `PlanesEntrenamientoService`
- [x] Inyectar `PlanesEntrenamientoRepository`, `PlanFactoriesProvider`, `PlanStateFactory`, `PlanSubject`.
- [x] Implementar `crear(tipo, dto, entrenadorId)`: elige factory y persiste con `repository.crear(...)` en estado BORRADOR.
- [x] Implementar `findAll(workspaceId)` → `repository.findAllPorWorkspace`.
- [x] Implementar `findById(id, workspaceId)` → `repository.findByIdConEjercicios`.
- [x] Implementar `activar(id, workspaceId)`: carga plan, instancia state, delega `state.activar(plan, { repository, subject })`.
- [x] Implementar `archivar(id, workspaceId)`: análogo a `activar`.
- [x] Implementar `duplicar(id, workspaceId)`: carga plan, `prototype.clone()`, `repository.crearDesdeClone(snapshot)`.
- [x] Implementar `agregarEjercicio(planId, dto)` → `repository.agregarEjercicioPlan` + notificar si plan ACTIVO.
- [x] Implementar `quitarEjercicio(planId, ejercicioPlanId)` → `repository.quitarEjercicioPlan` + notificar si plan ACTIVO.

### B6.5 Controller
- [x] `POST /api/planes-entrenamiento` body `{ nombre, descripcion, tipo }`.
- [x] `GET /api/planes-entrenamiento`.
- [x] `GET /api/planes-entrenamiento/:id`.
- [x] `PATCH /api/planes-entrenamiento/:id/activar`.
- [x] `PATCH /api/planes-entrenamiento/:id/archivar`.
- [x] `POST /api/planes-entrenamiento/:id/duplicar`.
- [x] `POST /api/planes-entrenamiento/:id/ejercicios`.
- [x] `DELETE /api/planes-entrenamiento/:id/ejercicios/:ejercicioPlanId`.

### B6.6 Tests
- [x] `planes-entrenamiento.repository.spec.ts` con `PrismaService` mockeado.
- [x] `hipertrofia.factory.spec.ts`: defaults correctos.
- [x] `fuerza.factory.spec.ts`: defaults correctos.
- [x] `resistencia.factory.spec.ts`: defaults correctos.
- [x] `borrador.state.spec.ts` mockeando repositorio: activar sin ejercicios lanza error; con ejercicios transiciona.
- [x] `activo.state.spec.ts` mockeando repositorio: archivar transiciona; activar lanza error.
- [x] `archivado.state.spec.ts`: ambas transiciones lanzan error.
- [x] `plan.prototype.spec.ts`: clone genera nuevo objeto con ids vacíos y suffijo `(copia)`.

---

## Fase B7 — Asignaciones + Observer

**Objetivo:** asignar plan a cliente y notificar (in-app + email) cuando un plan activo cambia.

### B7.1 Interfaces Observer
- [x] Crear `planes-entrenamiento/observers/subject.interface.ts` con `Observer.update(evento)` y `Subject.subscribe/unsubscribe/notify`.
- [x] Definir `EventoPlan = { tipo: 'PLAN_ACTIVADO' | 'PLAN_MODIFICADO' | 'PLAN_ARCHIVADO'; planId; clienteId }`.

### B7.2 `PlanSubject`
- [x] Crear servicio `plan-subject.service.ts` (singleton NestJS) con `Map<planId, Set<Observer>>`.
- [x] Implementar `notify(planId, evento)` que itera observers.

### B7.3 Repositorios involucrados
- [x] Crear `notificaciones/repositories/notificaciones.repository.ts` con `crear(dto)`, `findNoLeidasPorCliente(clienteId)`, `marcarLeida(id)`.
- [x] Crear `asignaciones/repositories/asignaciones-entrenamiento.repository.ts` con `crear(dto)`, `findPorCliente(clienteId)`, `findPorPlan(planId)`, `updateEstado(id, estado)`, `findActivaPorCliente(clienteId)`.

### B7.4 Observers concretos
- [x] Crear `cliente.observer.ts` que recibe `NotificacionesRepository` (no Prisma) y persiste fila en `Notificacion`.
- [x] Crear `email-notification.observer.ts` que recibe `mailer` y envía email con `cambio-plan.hbs`.
- [x] Crear template `mailer/templates/cambio-plan.hbs`.

### B7.5 `AsignacionesService`
- [x] Inyectar `AsignacionesEntrenamientoRepository`, `PlanesEntrenamientoRepository`, `ClientesRepository`, `NotificacionesRepository`, `PlanSubject`, `MailerService`.
- [x] Implementar `asignarEntrenamiento({ clienteId, planEntrenamientoId })`.
- [x] Validar cliente y plan en mismo workspace usando los repositorios.
- [x] Validar plan estado = ACTIVO.
- [x] `asignacionesRepository.crear({ ..., estado: 'ACTIVO' })`.
- [x] Suscribir `ClienteObserver(notificacionesRepository, clienteId)` y `EmailObserver(mailer, correoCliente)` al `PlanSubject` para ese `planId`.
- [x] Implementar `cambiarEstado(asignacionId, estado)` → `asignacionesRepository.updateEstado`.

### B7.6 Disparo desde §B6
- [x] En `activar()`: tras persistir, `subject.notify({ tipo: 'PLAN_ACTIVADO' })`.
- [x] En `agregarEjercicio`/`quitarEjercicio` con plan ACTIVO: `subject.notify({ tipo: 'PLAN_MODIFICADO' })`.
- [x] En `archivar()`: `subject.notify({ tipo: 'PLAN_ARCHIVADO' })`.

### B7.7 Controller asignaciones
- [x] `POST /api/asignaciones/entrenamiento`.
- [x] `GET /api/clientes/:id/asignaciones`.
- [x] `PUT /api/asignaciones/:id` body `{ estado }`.

### B7.8 Notificaciones (servicio + endpoints)
- [x] Crear `NotificacionesService` que consume `NotificacionesRepository`.
- [x] `GET /api/notificaciones` (CLIENTE) — lista no leídas.
- [x] `PATCH /api/notificaciones/:id/leer`.

### B7.9 Tests
- [x] `notificaciones.repository.spec.ts` y `asignaciones-entrenamiento.repository.spec.ts` con `PrismaService` mockeado.
- [x] `plan-subject.spec.ts`: subscribe/unsubscribe/notify llaman a observers correctos.
- [x] `cliente.observer.spec.ts` mockeando `NotificacionesRepository`: persiste notificación con mensaje según evento.
- [x] `email-notification.observer.spec.ts`: invoca mailer con el template correcto.

---

## Fase B8 — Registros + Builder + ArchivarPlanCommand

**Objetivo:** registrar entrenamientos vía Builder y completar el tercer command (archivar plan con undo).

### B8.1 `RegistroEntrenamientoBuilder`
- [x] Crear `registros/builders/registro-entrenamiento.builder.ts`.
- [x] Setters: `setFecha`, `setClienteId`, `addEjercicio`, `setNotas`, `setDuracionMin`.
- [x] `build()` valida que haya `fecha`, `clienteId` y al menos 1 ejercicio; si no, lanza error.
- [x] `build()` devuelve copia inmutable.

### B8.2 `RegistrosEntrenamientoRepository`
- [x] Crear `registros/repositories/registros-entrenamiento.repository.ts`.
- [x] Métodos: `crearConEjercicios(payload)` (transacción interna con `RegistroDeEntrenamiento` + `RegistroDeEjercicio[]`), `listarPorCliente(clienteId, filtros)`, `findPorClienteConDetalle(clienteId)` (para progreso §B9).

### B8.3 `RegistrosService`
- [x] Inyectar `RegistrosEntrenamientoRepository` y `ClientesRepository`.
- [x] Validar que cliente pertenece al workspace vía `ClientesRepository`.
- [x] Instanciar builder y aplicar setters iterando el DTO.
- [x] Llamar `build()` y persistir vía `registrosRepository.crearConEjercicios(payload)`.
- [x] Implementar `listar(clienteId, { page, limit, desde, hasta })` → `registrosRepository.listarPorCliente`.

### B8.4 Controller
- [x] `POST /api/clientes/:id/registros-entrenamiento`.
- [x] `GET /api/clientes/:id/registros-entrenamiento` con paginación.

### B8.5 `ArchivarPlanCommand`
- [x] Constructor recibe `planesService`, `planId`, `workspaceId`.
- [x] `execute()`: guarda `estadoPrevio` y llama `planesService.archivar()`.
- [x] `undo()`: si `estadoPrevio === ACTIVO`, llama `planesService.activar()`.

### B8.6 Endpoint
- [x] `PATCH /api/planes-entrenamiento/:id/archivar` pasa por `CommandInvoker`.

### B8.7 Tests
- [x] `registros-entrenamiento.repository.spec.ts` con `PrismaService` mockeado.
- [x] `registro-entrenamiento.builder.spec.ts`: build sin ejercicios falla.
- [x] `registro-entrenamiento.builder.spec.ts`: build con ejercicios construye objeto correcto.
- [x] `archivar-plan.command.spec.ts`: execute archiva; undo restaura estado previo.

---

## Fase B9 — Progreso + Strategy

**Objetivo:** tres estrategias intercambiables seleccionables por query param.

### B9.1 Interfaz y tipos
- [x] Crear `progreso/strategies/progreso-strategy.interface.ts` con `calcular(registros): ProgresoResumen`.
- [x] Definir `ProgresoResumen` y `PeriodoResumen`.

### B9.2 Estrategias concretas
- [x] Crear `progreso-semanal.strategy.ts` agrupando por ISO week.
- [x] Crear `progreso-mensual.strategy.ts` agrupando por `YYYY-MM`.
- [x] Crear `progreso-por-plan.strategy.ts` agrupando por plan asignado vigente.

### B9.3 `ProgresoContext` / Service
- [x] Crear `progreso/progreso.service.ts`.
- [x] Inyectar `RegistrosEntrenamientoRepository` (reuso del de §B8.2; no inyectar Prisma).
- [x] Implementar `setEstrategia(s)`.
- [x] Implementar `calcularProgreso(clienteId, vista)` que llama `registrosRepository.findPorClienteConDetalle(clienteId)` y delega a la strategy.

### B9.4 Endpoint
- [x] `GET /api/clientes/:id/progreso?vista=semanal|mensual|porPlan` (default `semanal`).
- [x] Validar `vista` con `@IsIn(['semanal','mensual','porPlan'])` en query DTO.

### B9.5 Tests
- [x] `progreso-semanal.strategy.spec.ts` con dataset fijo en memoria.
- [x] `progreso-mensual.strategy.spec.ts` con dataset fijo en memoria.
- [x] `progreso-por-plan.strategy.spec.ts` con dataset fijo en memoria.
- [x] `progreso.service.spec.ts`: selecciona la strategy correcta según query.

---

## Fase B10 — Dashboard + Facade

**Objetivo:** un único endpoint que el frontend consume para la pantalla principal del cliente.

### B10.1 `ClienteDashboardFacade`
- [x] Crear `dashboard/cliente-dashboard.facade.ts`.
- [x] Inyectar **únicamente servicios** (`ClientesService`, `PlanesEntrenamientoService`, `RegistrosService`, `ProgresoService`); el facade no toca repositorios ni Prisma.
- [x] Implementar `getDashboardCliente(clienteId, workspaceId)`.
- [x] Componer: cliente + plan activo + últimos 5 registros + resumen semanal.

### B10.2 Endpoint
- [x] `GET /api/clientes/:id/dashboard` (ENTRENADOR).

### B10.3 Tests
- [x] `cliente-dashboard.facade.spec.ts` con servicios mockeados: verifica composición y orden de llamadas.

---

## Fase B11 — Tests unitarios consolidados + e2e happy path

**Objetivo:** cobertura mínima de los patrones y un e2e que recorra el flujo completo.

### B11.1 Configuración Jest e2e
- [x] Confirmar/ajustar `apps/api/test/jest-e2e.json`.
- [x] Agregar variable `DATABASE_URL_TEST` apuntando a esquema/DB de test.
- [x] Crear `globalSetup` que ejecute `prisma migrate deploy` sobre la DB de test.
- [x] Agregar script `pnpm --filter api test:e2e`.

### B11.2 Helpers de test
- [x] Crear `apps/api/test/helpers/db.ts` con `truncateAll(prisma)`.
- [x] Crear `apps/api/test/helpers/auth.ts` con `registrarEntrenadorYLogin(app)` y `crearClientePorInvitacion(app, token)`.

### B11.3 e2e happy path (`happy-path.e2e-spec.ts`)
- [x] Paso 1 — `POST /auth/register` entrenador y guardar `tokenEntrenador`.
- [x] Paso 2 — `POST /clientes/invitar` con `correo=cli@test` y capturar `tokenInvitacion`.
- [x] Paso 3 — `POST /auth/cliente/register` con ese token y guardar `tokenCliente`.
- [x] Paso 4 — `POST /ejercicios` ×3; segunda llamada a `GET /ejercicios` no consulta Prisma (Decorator).
- [x] Paso 5 — `POST /planes-entrenamiento` con `tipo=HIPERTROFIA`; verificar defaults de la factory.
- [x] Paso 6 — `POST /planes-entrenamiento/:id/ejercicios` ×2.
- [x] Paso 7 — `PATCH /planes-entrenamiento/:id/activar` (State transition).
- [x] Paso 8 — `POST /asignaciones/entrenamiento`.
- [x] Paso 9 — `GET /notificaciones` con `tokenCliente` debe devolver ≥1 (Observer).
- [x] Paso 10 — `POST /clientes/:id/registros-entrenamiento` con 2 ejercicios (Builder).
- [x] Paso 11 — `GET /clientes/:id/dashboard` y verificar shape (Facade).
- [x] Paso 12 — `GET /clientes/:id/progreso?vista=semanal` con `periodos.length >= 1` (Strategy).
- [x] Paso 13 — `POST /planes-entrenamiento/:id/duplicar`; verificar nuevo id y sufijo `(copia)` (Prototype).
- [x] Paso 14 — `DELETE /clientes/:id`; cliente queda `estaActivo=false` (Command + Memento).
- [x] Paso 15 — `POST /commands/undo`; cliente vuelve a `estaActivo=true`.

### B11.4 Cobertura mínima
- [x] Cada patrón tiene al menos un `.spec.ts` ya escrito en fases anteriores.
- [x] Generar reporte con `pnpm --filter api test --coverage`.
- [x] Verificar >80% líneas en los archivos de patrones.

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
    ├── usuarios/
    │   └── repositories/usuarios.repository.ts
    ├── entrenadores/
    │   └── repositories/entrenadores.repository.ts
    ├── espacios-de-trabajo/
    │   └── repositories/espacios-de-trabajo.repository.ts
    ├── registry/
    │   ├── workspace.registry.ts
    │   └── ejercicios.catalog.ts
    ├── ejercicios/
    │   ├── repositories/ejercicios.repository.ts
    │   ├── decorators/
    │   ├── interfaces/
    │   └── ejercicios.service.ts (impl)
    ├── mailer/
    │   └── templates/
    ├── commands/
    │   ├── command.interface.ts
    │   └── command-invoker.service.ts
    ├── invitaciones/
    │   └── repositories/invitaciones.repository.ts
    ├── clientes/
    │   ├── repositories/clientes.repository.ts
    │   └── memento/
    ├── planes-entrenamiento/
    │   ├── repositories/planes-entrenamiento.repository.ts
    │   ├── factories/
    │   ├── states/
    │   ├── prototypes/
    │   └── observers/
    ├── asignaciones/
    │   └── repositories/asignaciones-entrenamiento.repository.ts
    ├── registros/
    │   ├── repositories/registros-entrenamiento.repository.ts
    │   └── builders/
    ├── progreso/
    │   └── strategies/
    ├── dashboard/
    │   └── cliente-dashboard.facade.ts
    └── notificaciones/
        └── repositories/notificaciones.repository.ts
```

**Regla recordatoria:** el único directorio donde se importa `PrismaService` o `@prisma/client` para queries es `repositories/`. Cualquier otro archivo que lo haga es un bug del patrón.
