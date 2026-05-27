# Plan Frontend MVP — Fitness SaaS (Next.js)

Plan atomizado por fases para el frontend. Cada paso es una unidad de trabajo independiente que termina con la página renderizando datos reales del backend.

Referencias cruzadas: `MVP_BACKEND_PLAN.md`, `deep-dive-patterns.md`, `design-patterns.md`, `poster.pdf`, `system_design_analysis.md`.

---

## 0. Convenciones

- [ ] Trabajar todo bajo `apps/web/`.
- [ ] Usar App Router de Next.js 16; layouts como Server Components, páginas de datos como `'use client'`.
- [ ] Estilo con Tailwind + shadcn/ui; iconos con `lucide-react`.
- [ ] Estado servidor: TanStack Query. Estado cliente local: `useState`/`useReducer` (sin Zustand).
- [ ] Formularios con `react-hook-form` + `zod` + `@hookform/resolvers/zod`.
- [ ] Cliente HTTP: helper `apiFetch` propio que adjunta `Authorization: Bearer <token>` desde `localStorage`.
- [ ] Toasts con `sonner`.
- [ ] Cerrar cada fase con commit `feat(web): <fase> — <resumen>`.

---

## Fase F0 — Setup base

**Objetivo:** proyecto listo con todas las librerías, providers y primitivos UI.

### F0.1 Dependencias
- [x] `pnpm --filter web add @tanstack/react-query @tanstack/react-query-devtools`.
- [x] `pnpm --filter web add react-hook-form zod @hookform/resolvers`.
- [x] `pnpm --filter web add sonner lucide-react clsx tailwind-merge class-variance-authority`.
- [x] `pnpm --filter web add date-fns`.

### F0.2 Tailwind
- [x] Inicializar Tailwind: `npx tailwindcss init -p`.
- [x] Configurar `tailwind.config.ts` apuntando a `./src/**/*.{ts,tsx}`.
- [x] Crear/actualizar `globals.css` con `@tailwind base; @tailwind components; @tailwind utilities;`.
- [x] Importar `globals.css` en `app/layout.tsx`.

### F0.3 shadcn/ui
- [x] Ejecutar `npx shadcn@latest init` (estilo `default`, alias `@/components/ui`).
- [x] Generar primitivos: `button`, `input`, `label`, `card`, `dialog`, `select`, `tabs`, `badge`, `form`, `textarea`, `table`, `toast`, `skeleton`, `dropdown-menu`, `separator`.

### F0.4 Providers globales
- [x] Crear `apps/web/src/app/providers.tsx` (client).
- [x] Configurar `QueryClientProvider` con `defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }`.
- [x] Agregar `<Toaster richColors />` de sonner.
- [x] Envolver con `<AuthProvider>` (ver F0.5).
- [x] Importar `<Providers>` en `app/layout.tsx`.

### F0.5 AuthContext
- [x] Crear `apps/web/src/lib/auth/auth-context.tsx`.
- [x] Estado `user: { id, rol, workspaceId, nombre } | null`.
- [x] Implementar `login(token, user)` que guarda en `localStorage` y estado.
- [x] Implementar `logout()` que limpia ambos.
- [x] Hidratar desde `localStorage` en `useEffect`.
- [x] Hook `useAuth()`.
- [x] Hook `useRequireAuth(rol?)` que redirige a `/login` si no hay sesión o rol no coincide.

### F0.6 `apiFetch`
- [x] Crear `apps/web/src/lib/api/api-fetch.ts`.
- [x] Adjuntar `Authorization` automáticamente si hay token.
- [x] Lanzar `ApiError` con `status` y `mensaje` en respuestas no-OK.
- [x] Exportar tipo `ApiError`.

### F0.7 Tipos compartidos
- [x] Crear `apps/web/src/lib/types/api.ts` con tipos `Cliente`, `PlanDeEntrenamiento`, `Ejercicio`, `EjercicioPlan`, `RegistroDeEntrenamiento`, `Notificacion`, `DashboardCliente`, `ProgresoResumen`.

### F0.8 Layout raíz
- [x] Configurar `app/layout.tsx` con HTML base, fuente sans-serif, `<Providers>`.
- [x] Crear `app/page.tsx` que redirige según rol: ENTRENADOR → `/workspace`, CLIENTE → `/cliente/planes`, sin sesión → `/login`.

---

## Fase F1 — Auth pública

**Objetivo:** rutas `/login`, `/register`, `/invitacion/[token]` funcionales.

### F1.1 Esqueleto del segmento público
- [x] Crear `app/(public)/layout.tsx` con `<main>` centrado + card.

### F1.2 `/login`
- [x] Crear `app/(public)/login/page.tsx`.
- [x] Form con `correo` y `contrasena` (zod schema).
- [x] Mutation a `POST /auth/login`.
- [x] En éxito: `login(token, usuario)` y redirige según rol.
- [x] Link a `/register`.

### F1.3 `/register`
- [x] Crear `app/(public)/register/page.tsx`.
- [x] Form con `correo`, `contrasena`, `nombre`, `apellido`, `nombreWorkspace`.
- [x] Mutation a `POST /auth/register`.
- [x] En éxito: login automático → redirige a `/workspace`.

### F1.4 `/invitacion/[token]`
- [x] Crear `app/(public)/invitacion/[token]/page.tsx`.
- [x] `useQuery` a `GET /invitaciones/:token/verificar`.
- [x] Mostrar error si inválida/expirada/consumida.
- [x] Si válida: form con `correo` (prefilled, disabled), `contrasena`, `nombre`, `apellido`.
- [x] Mutation a `POST /auth/cliente/register`.
- [x] En éxito: login automático → redirige a `/cliente/planes`.

### F1.5 Manejo de errores
- [x] Crear hook `useApiErrorToast(error)` que muestra `error.mensaje` en toast.
- [x] Aplicar en las 3 mutations.

---

## Fase F2 — Layout y home del entrenador

**Objetivo:** layout protegido con sidebar y pantalla de listado de clientes.

### F2.1 Layout protegido
- [x] Crear `app/(entrenador)/layout.tsx` (client).
- [x] Llamar `useRequireAuth('ENTRENADOR')`.
- [x] Renderizar `<SidebarEntrenador />` + `<main>{children}</main>`.

### F2.2 `<SidebarEntrenador />`
- [x] Crear `apps/web/src/components/layout/sidebar-entrenador.tsx`.
- [x] Links: `Clientes` (`/workspace`), `Planes` (`/workspace/planes`), `Ejercicios` (`/workspace/ejercicios`).
- [x] Footer con nombre del entrenador y botón `Cerrar sesión`.

### F2.3 Listado de clientes (`/workspace`)
- [x] Crear `app/(entrenador)/workspace/page.tsx`.
- [x] `useQuery(['clientes'], …)` → `GET /clientes`.
- [x] Tabla con columnas: avatar (iniciales), nombre, correo, estado (badge), último entrenamiento.
- [x] Click en fila → navega a `/workspace/clientes/<id>`.

### F2.4 Dialog "Invitar cliente"
- [x] Botón `Invitar cliente` en header de la tabla.
- [x] Crear `<DialogInvitarCliente />` con form `correo` (zod email).
- [x] Mutation a `POST /clientes/invitar`.
- [x] En éxito: mostrar `tokenInvitacion` en `<Code>` copiable + toast.
- [x] Invalidar `['invitaciones']`.

### F2.5 Estados de carga y vacío
- [x] Skeleton de tabla durante `isLoading`.
- [x] Empty state con CTA "Invitar tu primer cliente".

---

## Fase F3 — Dashboard del cliente (Facade en uso)

**Objetivo:** `/workspace/clientes/[id]` consume un único endpoint y renderiza 4 tarjetas.

### F3.1 Ruta y query
- [x] Crear `app/(entrenador)/workspace/clientes/[id]/page.tsx`.
- [x] `useQuery(['cliente-dashboard', id], …)` → `GET /clientes/:id/dashboard`.

### F3.2 Layout de tarjetas
- [x] Grid 2x2 de `<Card>`.
- [x] Tarjeta `Perfil`: nombre, correo, estado, fecha de alta.
- [x] Tarjeta `Plan activo`: nombre, tipo (badge), nº ejercicios, botón `Ver plan` → `/workspace/planes/<planId>`.
- [x] Tarjeta `Últimos registros`: lista de 5 con fecha, duración, nº ejercicios.
- [x] Tarjeta `Progreso semanal`: tabla mini con `etiqueta`, `entrenamientos`, `volumenTotal`.

### F3.3 Acciones del cliente
- [x] Header con dropdown: `Editar`, `Desactivar`.
- [x] `Desactivar` → confirm dialog → `DELETE /clientes/:id` → `toastConUndo` (ver F8).

### F3.4 Estado de carga
- [x] Skeleton de las 4 cards mientras `isLoading`.

---

## Fase F4 — Planes (Factory + State + Prototype en UI)

**Objetivo:** wizard de creación, listado, editor con transiciones de estado y duplicación.

### F4.1 Listado `/workspace/planes`
- [x] Crear `app/(entrenador)/workspace/planes/page.tsx`.
- [x] `useQuery(['planes'])` → `GET /planes-entrenamiento`.
- [x] Cards con nombre, tipo (badge), estado (badge), nº ejercicios, fecha de creación.
- [x] Botón `Nuevo plan` → `/workspace/planes/nuevo`.

### F4.2 Wizard `/workspace/planes/nuevo`
- [x] Crear `app/(entrenador)/workspace/planes/nuevo/page.tsx`.
- [x] Crear componente `<WizardPlan />` con dos pasos en estado local.
- [x] Paso 1 (Factory): 3 cards seleccionables `Hipertrofia` (4×10, 60s), `Fuerza` (5×5, 180s), `Resistencia` (3×15, 30s).
- [x] Botón `Siguiente` deshabilitado hasta elegir tipo.
- [x] Paso 2: form con `nombre`, `descripcion`.
- [x] Mutation `POST /planes-entrenamiento` con `{ nombre, descripcion, tipo }`.
- [x] En éxito: navega a `/workspace/planes/<id>`.

### F4.3 Editor `/workspace/planes/[id]`
- [x] Crear `app/(entrenador)/workspace/planes/[id]/page.tsx`.
- [x] Header con nombre, badge de tipo, badge de estado, botones según estado.
- [x] Tabs `Ejercicios` e `Información`.

### F4.4 Tab Ejercicios
- [x] Tabla `EjercicioPlan` con columnas: orden, ejercicio, grupo, series, reps, descanso, notas, acciones.
- [x] Botón `Agregar ejercicio` → dialog con `<Select>` del catálogo (`GET /ejercicios`).
- [x] Inputs `series`, `repeticiones`, `segundosDeDescanso`, `orden`, `notas`.
- [x] Mutation `POST /planes-entrenamiento/:id/ejercicios`.
- [x] Eliminar → `DELETE /planes-entrenamiento/:id/ejercicios/:ejercicioPlanId`.
- [x] Deshabilitar acciones si plan ARCHIVADO.

### F4.5 Tab Información
- [x] Mostrar `nombre`, `descripcion`, `creadoEn`, `actualizadoEn`.
- [ ] (Opcional MVP) Form de edición de `nombre/descripcion`.

### F4.6 Botones de transición de estado (State pattern visible)
- [x] Si `BORRADOR`: botón `Activar` (deshabilitado si `ejercicios.length === 0`, con tooltip explicativo).
- [x] Si `ACTIVO`: botón `Archivar`.
- [x] Si `ARCHIVADO`: sin botones, solo badge.
- [x] Mutation `PATCH /planes-entrenamiento/:id/activar`/`/archivar` con invalidación de `['planes']` y `['plan', id]`.
- [x] En `Archivar` mostrar `toastConUndo` (POST `/commands/undo`).
- [x] Capturar 400/409 del backend (transición inválida) y mostrar toast de error.

### F4.7 Botón "Duplicar" (Prototype)
- [x] Botón visible siempre en header del editor.
- [x] Mutation `POST /planes-entrenamiento/:id/duplicar`.
- [x] Navegar al nuevo plan `/workspace/planes/<nuevoId>`.
- [x] Toast `"Plan duplicado como '<nombre> (copia)'"`.

---

## Fase F5 — Catálogo de ejercicios

**Objetivo:** listar y crear ejercicios. Endpoint con Decorator activo en backend.

### F5.1 Listado `/workspace/ejercicios`
- [x] Crear `app/(entrenador)/workspace/ejercicios/page.tsx`.
- [x] `useQuery(['ejercicios'])` → `GET /ejercicios`.
- [x] Filtro por grupo muscular con `<Select>` que dispara `useQuery(['ejercicios', grupo])` a `/ejercicios/por-grupo/:grupo`.
- [x] Cards con imagen, nombre, badge de grupo, link al video si existe.

### F5.2 Dialog "Nuevo ejercicio"
- [x] Form con `nombre`, `grupoMuscular` (select del enum), `descripcion`, `instrucciones`, `imagenUrl`, `videoUrl`.
- [x] Mutation `POST /ejercicios`.
- [x] En éxito: invalidar `['ejercicios']`.

---

## Fase F6 — Vista del cliente (Builder + Strategy)

**Objetivo:** segmento `(cliente)` con plan asignado, registrar entrenamiento y progreso.

### F6.1 Layout `/cliente`
- [x] Crear `app/(cliente)/layout.tsx` (client) con `useRequireAuth('CLIENTE')`.
- [x] Crear `<SidebarCliente />` con links `Mi plan`, `Registrar`, `Progreso`.
- [x] Incluir `<NotificacionesBell />` en el header (ver F7).

### F6.1b Preparación de sesión/tipos
- [x] Extender tipos frontend con `AsignacionEntrenamiento`, `VistaProgreso`, `ProgresoCliente`.
- [x] Agregar `clienteId` opcional al `AuthContext` y helper `useMiClienteId()`.
- [x] Guardar `clienteId` al completar registro por invitación.

### F6.2 `/cliente/planes`
- [x] Crear `app/(cliente)/cliente/planes/page.tsx`.
- [x] `useQuery(['mi-plan'])` → `GET /clientes/<miClienteId>/asignaciones` filtrando activas (o endpoint dedicado).
- [x] Renderizar plan activo: nombre, tipo, lista de ejercicios con series/reps/descanso.
- [x] Empty state si no hay plan asignado.

### F6.3 `/cliente/registrar` — Wizard Builder
- [x] Crear `app/(cliente)/cliente/registrar/page.tsx`.
- [x] Crear `<WizardRegistro />` con 3 pasos en `useReducer` para conservar estado entre pasos.

**Paso 1 — Datos generales:**
- [x] Input `fecha` (date picker, default hoy).
- [x] Input `duracionMin`.
- [x] Input `notas`.
- [x] Botón `Siguiente`.

**Paso 2 — Ejercicios:**
- [x] Cargar plan activo y mostrar card por `EjercicioPlan` con `series`, `repeticiones`, `pesoKg`, `notas` editables.
- [x] Permitir agregar ejercicios libres con botón `+ Otro ejercicio`.
- [ ] Usar `useFieldArray` de `react-hook-form` para la lista. *(Pendiente: la implementación actual usa `useReducer` para mantener simple el Builder.)*
- [x] Botón `Siguiente`.

**Paso 3 — Confirmación:**
- [x] Resumen de fecha, duración y lista de ejercicios.
- [x] Botón `Guardar registro`.
- [x] Mutation `POST /clientes/<miClienteId>/registros-entrenamiento`.
- [x] En éxito: toast y redirige a `/cliente/progreso`.

### F6.4 `/cliente/progreso` — Tabs Strategy
- [x] Crear `app/(cliente)/cliente/progreso/page.tsx`.
- [x] Tabs con valores `semanal`, `mensual`, `porPlan`.
- [x] Cambio de tab cambia query key y dispara `GET /clientes/<miClienteId>/progreso?vista=<valor>`.
- [x] Tabla con columnas `etiqueta`, `entrenamientos`, `volumenTotal`, `pesoPromedio`.
- [x] (Opcional MVP) Bar chart simple con divs Tailwind, sin Recharts.

---

## Fase F7 — Notificaciones (Observer visible)

**Objetivo:** el cliente ve en tiempo casi-real las notificaciones disparadas por el observer del backend.

### F7.1 `<NotificacionesBell />`
- [x] Crear `apps/web/src/components/layout/notificaciones-bell.tsx`.
- [x] `useQuery(['notificaciones'], { refetchInterval: 30_000 })` → `GET /notificaciones`.
- [x] Icono campana + badge con conteo de no leídas.
- [x] Dropdown con últimas 10: `mensaje` + tiempo relativo (date-fns).

### F7.2 Marcar leída
- [x] Click en una notificación → mutation `PATCH /notificaciones/:id/leer`.
- [x] Invalidar `['notificaciones']`.

### F7.3 Botón "Marcar todas"
- [x] Botón en el footer del dropdown que itera y marca todas como leídas.

---

## Fase F8 — Undo global (Command visible)

**Objetivo:** todo punto del frontend que dispara un Command muestra un toast con acción `Deshacer`.

### F8.1 Helper `toastConUndo`
- [x] Crear `apps/web/src/lib/ui/toast-undo.ts`.
- [x] Aceptar `mensaje` y `onUndo: () => Promise<void>`.
- [x] Mostrar toast con acción `Deshacer` y `duration: 8000`.
- [x] Tras `onUndo`, mostrar toast `Acción deshecha`.

### F8.2 Aplicar el helper
- [x] En `DELETE /clientes/:id` (F3.3): `onUndo` llama `POST /commands/undo`.
- [x] En `PATCH /planes-entrenamiento/:id/archivar` (F4.6): igual.
- [x] En `POST /clientes/invitar` (F2.4): `onUndo` cancela la invitación.

### F8.3 Re-fetch tras undo
- [x] Tras `onUndo`, invalidar `['clientes']` cuando aplique.
- [x] Tras `onUndo`, invalidar `['planes']` cuando aplique.
- [x] Tras `onUndo`, invalidar `['invitaciones']` cuando aplique.

---

## Fase F9 — Estados de error, vacíos y carga global

**Objetivo:** experiencia consistente en bordes.

### F9.1 `ErrorBoundary` y `error.tsx`
- [x] Crear `app/error.tsx` con `<Card>` `Algo salió mal` + botón `Reintentar`.
- [x] Crear `app/(entrenador)/error.tsx`.
- [x] Crear `app/(cliente)/error.tsx`.

### F9.2 `not-found.tsx`
- [x] Crear `app/not-found.tsx` con enlace a `/`.

### F9.3 Loaders coherentes
- [x] Revisar cada página y asegurar que toda `useQuery` tenga un skeleton equivalente.

### F9.4 Interceptor de 401
- [x] En `apiFetch`, si `status === 401`: limpiar `localStorage`.
- [x] Redirigir a `/login`.

---

## Fase F10 — QA manual y verificación de patrones desde la UI

**Objetivo:** asegurar que un usuario que recorre la UI dispara todos los patrones del backend.

- [ ] Registrar entrenador → llegar a `/workspace`.
- [ ] Invitar cliente → tomar token del toast → registrar cliente en `/invitacion/<token>`.
- [ ] Crear 3 ejercicios → recargar → confirmar respuesta rápida (Decorator).
- [ ] Crear plan tipo `Hipertrofia` → editor muestra series/reps/descanso por defecto correctos (Factory).
- [ ] Activar plan → en sesión del cliente aparece notificación (Observer).
- [ ] Cliente registra entrenamiento via wizard (Builder).
- [ ] Cliente abre `/cliente/progreso` y cambia entre las 3 tabs (Strategy).
- [ ] Entrenador abre `/workspace/clientes/<id>` → ve dashboard (Facade).
- [ ] Entrenador duplica plan → nuevo plan con sufijo `(copia)` (Prototype).
- [ ] Entrenador archiva plan → toast con `Deshacer` → click → plan vuelve a ACTIVO (State + Command).
- [ ] Entrenador desactiva cliente → `Deshacer` → cliente vuelve a activo (Command + Memento).

---

## Apéndice — Estructura final del frontend

```
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── providers.tsx
│   ├── page.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── invitacion/[token]/page.tsx
│   ├── (entrenador)/
│   │   ├── layout.tsx
│   │   └── workspace/
│   │       ├── page.tsx
│   │       ├── clientes/[id]/page.tsx
│   │       ├── planes/
│   │       │   ├── page.tsx
│   │       │   ├── nuevo/page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── ejercicios/page.tsx
│   └── (cliente)/
│       ├── layout.tsx
│       └── cliente/
│           ├── plan/page.tsx
│           ├── registrar/page.tsx
│           └── progreso/page.tsx
├── components/
│   ├── ui/                       (shadcn primitives)
│   ├── layout/
│   │   ├── sidebar-entrenador.tsx
│   │   ├── sidebar-cliente.tsx
│   │   └── notificaciones-bell.tsx
│   └── features/
│       ├── planes/
│       │   ├── wizard-plan.tsx
│       │   └── tabla-ejercicios-plan.tsx
│       └── registros/
│           └── wizard-registro.tsx
└── lib/
    ├── api/api-fetch.ts
    ├── auth/auth-context.tsx
    ├── types/api.ts
    └── ui/toast-undo.ts
```
