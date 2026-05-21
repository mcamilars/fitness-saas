# Plan de Implementación MVP — Fitness SaaS (Índice)

Este documento es el índice del plan del MVP. Los planes detallados están separados en dos archivos:

- **Backend (NestJS):** [`MVP_BACKEND_PLAN.md`](./MVP_BACKEND_PLAN.md)
- **Frontend (Next.js):** [`MVP_FRONTEND_PLAN.md`](./MVP_FRONTEND_PLAN.md)

Ambos archivos comparten las decisiones técnicas y el mapa de patrones que se listan abajo.

---

## 1. Decisiones técnicas (fijadas)

| Aspecto | Decisión |
|---|---|
| Stack base | NestJS 11 (API) + Next.js 16 (web) + Postgres 16 (Docker) + Prisma 6 |
| Monorepo | Turborepo + pnpm (ya inicializado: `apps/api`, `apps/web`, `packages/database`) |
| Auth | JWT casero con `bcrypt` (sin Clerk) |
| Email | Mailtrap (SMTP sandbox) + Handlebars para template HTML |
| Frontend libs | TanStack Query + Tailwind + react-hook-form + zod + shadcn/ui |
| Multi-tenancy | `WorkspaceGuard` que valida `workspaceId` del JWT contra el recurso solicitado |
| Modelo | Solo entrenamiento (sin nutrición ni biométrico) |
| Tests | Unitarios por patrón + 1 e2e que recorre el happy path |
| Patrones | Los 11 patrones del póster integrados en el flujo real |

---

## 2. Modelo de datos del MVP

Entidades que se mantienen:

| Entidad | Razón |
|---|---|
| `EspacioDeTrabajo` | Tenancy raíz |
| `Usuario` | Identidad base (con `contrasenaHash`, no hay Clerk) |
| `Entrenador` | Perfil 1:1 con Usuario y 1:1 con Workspace |
| `Cliente` | Perfil 1:1 con Usuario, N:1 con Entrenador y Workspace |
| `Invitacion` | Token de invitación al workspace |
| `Ejercicio` | Catálogo global de ejercicios |
| `PlanDeEntrenamiento` | Plan con estado (BORRADOR/ACTIVO/ARCHIVADO) y tipo |
| `EjercicioPlan` | Ejercicio dentro de un plan (series, reps, descanso) |
| `AsignacionPlanEntrenamiento` | Relación cliente ↔ plan |
| `RegistroDeEntrenamiento` | Sesión de entrenamiento registrada por el cliente |
| `RegistroDeEjercicio` | Detalle por ejercicio dentro de un registro |
| `Notificacion` | (Nuevo) — soporta el patrón Observer |

Entidades eliminadas del MVP: `PerfilDelCliente`, `PlanDeNutricion`, `Comida`, `AsignacionPlanNutricion`, `RegistroDeNutricion`, `RegistroBiometrico`, `RefreshToken`.

Cambios al schema necesarios:
1. Agregar enum `TipoPlanEntrenamiento { HIPERTROFIA, FUERZA, RESISTENCIA }` y campo en `PlanDeEntrenamiento`.
2. Agregar modelo `Notificacion`.
3. Eliminar los modelos listados arriba.

---

## 3. Mapa de patrones (UML del póster → backend → frontend)

| Patrón | Clase del UML | Backend (archivo / endpoint) | Frontend (pantalla) |
|---|---|---|---|
| Factory Method | `EntrenamientoFactory` | `planes-entrenamiento/factories/*.factory.ts` · `POST /planes-entrenamiento` con `tipo` | `/workspace/planes/nuevo` paso 1 |
| Builder | `RegistroEntrenamientoBuilder` | `registros/builders/registro-entrenamiento.builder.ts` · `POST /clientes/:id/registros-entrenamiento` | `/cliente/registrar` wizard |
| Prototype | `PlanDeEntrenamiento.clone()` | `planes-entrenamiento/prototypes/plan.prototype.ts` · `POST /planes-entrenamiento/:id/duplicar` | Botón `Duplicar` en `/workspace/planes/[id]` |
| Decorator | `CacheEjerciciosDecorator` | `ejercicios/decorators/cache-ejercicios.decorator.ts` · transparente en `GET /ejercicios` | `/workspace/ejercicios` |
| Observer | `Subject` + `Cliente/EmailNotification` observers | `planes-entrenamiento/observers/*` · disparado en `PATCH /planes-entrenamiento/:id/activar` | `<NotificacionesBell />` |
| State | `PlanState` (`Borrador/Activo/Archived`) | `planes-entrenamiento/states/*` · `PATCH .../activar`, `PATCH .../archivar` | Botones de estado en `/workspace/planes/[id]` |
| Strategy | `ProgresoStrategy` (`Semanal/Mensual/PorPlan`) | `progreso/strategies/*` · `GET /clientes/:id/progreso?vista=` | Tabs en `/cliente/progreso` |
| Command | `Command` + `CommandInvoker` + `Invitar/Desactivar/Archivar` | `commands/*` · `POST /clientes/invitar`, `DELETE /clientes/:id`, `PATCH .../archivar`, `POST /commands/undo` | Toast `Deshacer` (helper `toastConUndo`) |
| Memento | `ClienteMemento` + `ClienteContainer` | `clientes/memento/*` · usado dentro de `DesactivarClienteCommand` | Indirecto vía toast `Deshacer` en eliminación |
| Facade | `ClienteDashboardFacade` | `dashboard/cliente-dashboard.facade.ts` · `GET /clientes/:id/dashboard` | `/workspace/clientes/[id]` |
| Singleton ("Singularity") | `WorkspaceRegistry`, `EjerciciosCatalog` | `registry/*` con `getInstance()` explícito | Indirecto (acelera respuestas) |

---

## 4. Variables de entorno

`apps/api/.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fitness
JWT_SECRET=<random-32-bytes>
JWT_EXPIRES_IN=2h
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=<user>
MAILTRAP_PASS=<pass>
MAILTRAP_FROM=no-reply@fitness.local
APP_URL=http://localhost:3000
```

`apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 5. Orden de ejecución recomendado entre los dos planes

1. **Backend B0 → B1** (limpieza + auth) — desbloquea todo.
2. **Backend B2 → B6** (singleton, decorator, command/memento, clientes, planes con factory/state/prototype).
3. **Frontend F0 → F2** (setup + auth + workspace navegable).
4. **Backend B7 → B10** (observer, builder, strategy, facade).
5. **Frontend F3 → F8** (todas las pantallas que dependen de los endpoints anteriores).
6. **Backend B11** (tests unitarios + e2e del happy path).
7. **Frontend F9 → F10** (estados de error y QA manual).

Cada fase termina con un commit independiente para que el avance sea trazable y reversible.

---

## 6. Out-of-scope explícito del MVP

- Nutrición, biométrico, reportes HTML (Handlebars solo se usa para el email de invitación).
- Refresh tokens y rotación.
- Multi-tenancy a nivel de middleware Prisma (se hace en guard).
- App móvil, push notifications, websockets.
- Pagos/suscripción.
- Roles distintos a `ENTRENADOR` y `CLIENTE`.
