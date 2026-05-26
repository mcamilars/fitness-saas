# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A **fitness SaaS** backend built as a university Design Patterns ("patrones") project. The architecture is intentionally organized to demonstrate GoF patterns — when a piece of code looks more elaborate than the feature requires (explicit Singletons, a Command invoker with undo history, a cache Decorator wired through a DI token), it is deliberate and serves the academic goal of making the pattern visible in code.

`docs/MVP_BACKEND_PLAN.md` is the authoritative, phase-by-phase roadmap (phases B0–B11). Each phase maps to a pattern and is checked off as work lands. Consult it before adding a module — the target file layout, method names, and DI wiring for upcoming work are already specified there. `docs/design-patterns.md` explains the intent of each of the 10 patterns. As of now phases B0–B4 are done; B5+ (clientes/memento, planes/factory+state+prototype, asignaciones/observer, registros/builder, progreso/strategy, dashboard/facade) are pending.

Domain language is **Spanish** throughout (entities, methods, variables, routes): `entrenador` (trainer), `cliente`, `espacioDeTrabajo` (workspace), `ejercicio`, `plan de entrenamiento`, `invitacion`. Keep new code in Spanish to match.

## Monorepo layout

Turborepo + pnpm workspaces (`pnpm@9`, Node `22.20.0` via `.nvmrc`).

- `apps/api` — **NestJS 11** backend. This is where essentially all work happens.
- `apps/web` — Next.js 16 app, currently the default starter (not yet built out).
- `packages/database` — `@repo/database`: shared **Prisma 6** client. Re-exports everything from `@prisma/client` plus a NestJS `PrismaService`/`PrismaModule`. Import models and `Prisma` namespace from `@repo/database`, never from `@prisma/client` directly.
- `packages/eslint-config` — shared ESLint config.

## Commands

Run from the repo root (turbo + pnpm filters):

```bash
pnpm db:up                      # start Postgres via docker-compose (port 5433)
pnpm db:down
pnpm db:generate                # prisma generate
pnpm db:migrate                 # prisma migrate dev (in @repo/database)
pnpm db:studio                  # prisma studio
pnpm db:migrate:reset           # reset DB + migrations

pnpm dev:api                    # run the API in watch mode (turbo --filter=api)
pnpm dev:web
pnpm build                      # turbo run build (all)
pnpm lint                       # eslint --fix across workspace
pnpm lint:check                 # eslint without fixing
pnpm check-types
```

API-specific (run inside `apps/api`, or `pnpm --filter api <script>`):

```bash
pnpm --filter api dev           # nest start --watch, serves on :4000, global prefix /api
pnpm --filter api test          # jest (unit, *.spec.ts under src/)
pnpm --filter api test:watch
pnpm --filter api test:cov
pnpm --filter api test:e2e      # jest --config ./test/jest-e2e.json
```

Run a single unit test:

```bash
pnpm --filter api test -- path/to/file.spec.ts
pnpm --filter api test -- -t "nombre del test"
```

The DB runs on **port 5433** (not 5432). `DATABASE_URL` lives in root `.env` and `packages/database/.env`. The API also needs `apps/api/.env` with `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAILTRAP_*`, and `APP_URL` (see `apps/api/src/config/env.validation.ts` for the full validated set; missing vars fail boot via `getOrThrow`).

## Architectural rules (these are load-bearing)

### Repository Pattern is mandatory (§0.1 of the backend plan)
`PrismaService` and `@prisma/client` queries are allowed **only** inside `modules/*/repositories/`. Services, commands, observers, facades, strategies, factories, states, and guards consume repositories — never Prisma. Any other file touching Prisma is a bug in the pattern.

- Repositories return typed domain entities, not raw `Prisma.*` shapes.
- Write methods accept an optional `tx?: Prisma.TransactionClient` and do `const client = tx ?? this.prisma`.
- Cross-entity transactions are opened via a helper on a repository (e.g. `UsuariosRepository.conTransaccion(callback)`) so the *service* never sees Prisma; the callback's `tx` is threaded into each repo's write method. See `auth.service.ts` + `usuarios.repository.ts` for the canonical example.

### Singletons are explicit, not NestJS providers
`WorkspaceRegistry` and `EjerciciosCatalog` (in `modules/registry/`) use `private constructor()` + `static getInstance()` with an in-memory `Map`, **deliberately not** NestJS DI singletons — the point is to show the pattern in code. They return shallow copies (`{ ...entity }`) so callers can't mutate internal state. They are caches/integration points, **not** the source of truth (the DB is). `EjerciciosCatalog.cargarDesde(repo)` is invoked in `main.ts` `bootstrap()` before `app.listen`. `WorkspaceGuard` reads `WorkspaceRegistry` first and falls back to the repo (lazily registering) on a miss.

### Decorator wired via a DI token
`EjerciciosModule` registers the real `EjerciciosServiceImpl` and a `CacheEjerciciosDecorator` that wraps it, exposed under the token `'EJERCICIOS_SERVICE'` via `useFactory`. Controllers `@Inject('EJERCICIOS_SERVICE')` and are oblivious to the cache. `create()` calls `flush()` to invalidate.

### Command Pattern
`commands/command.interface.ts` defines `execute()/undo()/descripcion()`. `CommandInvokerService` keeps a bounded (50) `historial` and exposes `ejecutar()`, `deshacer()`/`deshacerUltimo()`, `getHistorial()`. Commands receive repositories/services in their constructor (no Prisma). `POST /api/commands/undo` triggers undo of the last command.

### HTTP conventions (configured globally in `main.ts`)
- Global route prefix `/api`.
- `ValidationPipe({ whitelist: true, transform: true })` — all input via `class-validator` DTOs.
- Success responses are wrapped as `{ data: ... }` by `TransformInterceptor`.
- Errors are normalized to `{ statusCode, mensaje, error }` by `HttpExceptionFilter` (catches everything; `mensaje` may be a `string[]` for validation errors).
- CORS limited to `APP_URL`.

### Auth
JWT via `@nestjs/passport` + `passport-jwt`. Payload is `{ sub, rol, workspaceId }`, mapped in `jwt.strategy.ts` to `req.user` as `AuthenticatedUser`. `JwtAuthGuard` is just `extends AuthGuard('jwt')`. Use the `@CurrentUser()` / `@CurrentWorkspace()` decorators and `@Roles()` + `RolesGuard` for authorization. Tenancy is enforced by `WorkspaceGuard` (see registry note above).

### Module structure convention
Each feature module lives at `modules/<nombre>/` with subfolders `controllers/`, `services/`, `repositories/`, `dtos/`, plus a pattern-specific folder when applicable (`factories/`, `builders/`, `states/`, `strategies/`, `observers/`, `decorators/`, `memento/`, `commands/`). Each repository gets a `<Entidad>RepositoryInterface` (same file is fine) to enable mocking in tests.

### Tests
Unit specs mock **repositories**, not Prisma (repository specs may mock `PrismaService`). Specs sit next to the code as `*.spec.ts` under `src/`.

### Mailer / Handlebars assets
`MailerService` reads `.hbs` templates from `__dirname/templates` at runtime, so `nest-cli.json` copies `modules/mailer/templates/**/*.hbs` into `dist`. If you add templates elsewhere, update the `assets` array or `readFile` will fail in the built output.
