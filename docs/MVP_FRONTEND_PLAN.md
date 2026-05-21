# Plan Frontend MVP — Fitness SaaS (Next.js)

Plan atomizado por fases para el frontend. Cada paso es una unidad de trabajo independiente que termina con la página renderizando datos reales del backend.

Referencias cruzadas: `MVP_BACKEND_PLAN.md`, `deep-dive-patterns.md`, `design-patterns.md`, `poster.pdf`, `system_design_analysis.md`.

---

## 0. Convenciones

- Ruta raíz del frontend: `apps/web/`.
- App Router de Next.js 16. Server Components solo para layouts; las páginas con datos son client components (`'use client'`).
- Estilo: Tailwind + shadcn/ui. Iconos: `lucide-react`.
- Estado servidor: TanStack Query. Estado cliente local: `useState`/`useReducer` (sin Zustand).
- Formularios: `react-hook-form` + `zod` + `@hookform/resolvers/zod`.
- Cliente HTTP: helper `apiFetch` propio que adjunta `Authorization: Bearer <token>` desde `localStorage`.
- Notificaciones UI: `sonner` (toasts).
- Cada fase termina con un commit independiente con mensaje `feat(web): <fase> — <resumen>`.

---

## Fase F0 — Setup base

**Objetivo:** dejar el proyecto listo con todas las librerías, providers y primitivos UI.

### F0.1 Dependencias
- `pnpm --filter web add @tanstack/react-query @tanstack/react-query-devtools`
- `pnpm --filter web add react-hook-form zod @hookform/resolvers`
- `pnpm --filter web add sonner lucide-react clsx tailwind-merge class-variance-authority`
- `pnpm --filter web add date-fns`

### F0.2 Tailwind
- Inicializar Tailwind si no está: `npx tailwindcss init -p`.
- Configurar `tailwind.config.ts` apuntando a `./src/**/*.{ts,tsx}`.
- Agregar `globals.css` con `@tailwind base; @tailwind components; @tailwind utilities;` e importarlo en `app/layout.tsx`.

### F0.3 shadcn/ui
- `npx shadcn@latest init` (estilo `default`, alias `@/components/ui`).
- Generar primitivos iniciales: `button input label card dialog select tabs badge form textarea table toast skeleton dropdown-menu separator`.

### F0.4 Providers globales
- `apps/web/src/app/providers.tsx` (client component):
  - `QueryClientProvider` con `defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }`.
  - `<Toaster richColors />` de sonner.
  - `<AuthProvider>` (ver F0.5).
- Importar en `app/layout.tsx`.

### F0.5 AuthContext
- `apps/web/src/lib/auth/auth-context.tsx` con:
  - `user: { id, rol, workspaceId, nombre } | null`.
  - `login(token, user)` → guarda en `localStorage` y en estado.
  - `logout()` → limpia.
  - Hidrata desde `localStorage` en `useEffect`.
- Hook `useAuth()` y `useRequireAuth(rol?)` que redirige a `/login` si no hay sesión o rol no coincide.

### F0.6 `apiFetch`
- `apps/web/src/lib/api/api-fetch.ts`:
  ```ts
  export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = localStorage.getItem('jwt');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err.mensaje ?? res.statusText, res.status);
    }
    return res.json();
  }
  ```
- Clase `ApiError` con `status`.

### F0.7 Tipos compartidos
- `apps/web/src/lib/types/api.ts` con tipos `Cliente`, `PlanDeEntrenamiento`, `Ejercicio`, `RegistroDeEntrenamiento`, etc., reflejando exactamente las respuestas del backend.

### F0.8 Layout raíz
- `app/layout.tsx`: HTML base con `<Providers>` y fuente sans-serif.
- `app/page.tsx`: redirige según rol (`/workspace` si ENTRENADOR, `/cliente/plan` si CLIENTE, `/login` si no autenticado).

---

## Fase F1 — Auth pública

**Objetivo:** rutas `/login`, `/register`, `/invitacion/[token]` funcionales.

### F1.1 Esqueleto del segmento público
- Crear `app/(public)/layout.tsx` con un `<main>` centrado y card.

### F1.2 `/login`
- `app/(public)/login/page.tsx`:
  - Form con `correo`, `contrasena` (validación zod).
  - Mutation a `POST /auth/login`.
  - En éxito: `login(token, usuario)` del contexto, redirige según rol.
  - Link a `/register`.

### F1.3 `/register`
- `app/(public)/register/page.tsx`:
  - Form con `correo`, `contrasena`, `nombre`, `apellido`, `nombreWorkspace`.
  - Mutation a `POST /auth/register`.
  - En éxito: login automático y redirige a `/workspace`.

### F1.4 `/invitacion/[token]`
- `app/(public)/invitacion/[token]/page.tsx`:
  - `useQuery` a `GET /invitaciones/:token/verificar`.
  - Si inválida/expirada/consumida → mensaje de error.
  - Si válida → form con `correo` (prefilled, disabled), `contrasena`, `nombre`, `apellido` → `POST /auth/cliente/register`.
  - En éxito: login automático y redirige a `/cliente/plan`.

### F1.5 Manejo de errores
- Hook `useApiErrorToast(error)` que muestra `error.mensaje` en toast.
- Aplicar en las 3 mutations.

---

## Fase F2 — Layout y home del entrenador

**Objetivo:** layout protegido con sidebar y pantalla de listado de clientes.

### F2.1 Layout protegido
- `app/(entrenador)/layout.tsx` (client):
  - `useRequireAuth('ENTRENADOR')`.
  - Renderiza `<SidebarEntrenador />` + `<main>{children}</main>`.

### F2.2 `<SidebarEntrenador />`
- `apps/web/src/components/layout/sidebar-entrenador.tsx`.
- Links: `Clientes` (`/workspace`), `Planes` (`/workspace/planes`), `Ejercicios` (`/workspace/ejercicios`).
- Footer: nombre del entrenador + botón `Cerrar sesión`.

### F2.3 Listado de clientes (`/workspace`)
- `useQuery(['clientes'], () => apiFetch<{ clientes: Cliente[] }>('/clientes'))`.
- Tabla shadcn (`<Table>`) con columnas: avatar (iniciales), nombre, correo, estado (badge), último entrenamiento (TBD: usar `ultimoRegistroEn` si lo expone el backend; si no, "—").
- Click en fila → navega a `/workspace/clientes/<id>`.

### F2.4 Dialog "Invitar cliente"
- Botón `Invitar cliente` en header de la tabla → abre `<DialogInvitarCliente />`.
- Form con `correo` (zod email).
- Mutation a `POST /clientes/invitar`.
- En éxito: muestra el `tokenInvitacion` en un `<Code>` copiable + toast `"Invitación enviada por email. Link: ..."`.
- Invalida `['invitaciones']`.

### F2.5 Estados de carga y vacío
- Skeleton de tabla durante `isLoading`.
- Empty state cuando no hay clientes: ilustración + CTA "Invitar tu primer cliente".

---

## Fase F3 — Dashboard del cliente (Facade en uso)

**Objetivo:** `/workspace/clientes/[id]` consume un único endpoint y renderiza 4 tarjetas.

### F3.1 Ruta y query
- `app/(entrenador)/workspace/clientes/[id]/page.tsx`.
- `useQuery(['cliente-dashboard', id], () => apiFetch<DashboardCliente>('/clientes/' + id + '/dashboard'))`.

### F3.2 Layout de tarjetas
- Grid 2x2 de `<Card>`:
  1. **Perfil**: nombre, correo, estado, fecha de alta.
  2. **Plan activo**: nombre del plan, tipo (badge), nº de ejercicios, botón `Ver plan` → `/workspace/planes/<planId>`.
  3. **Últimos 5 registros**: lista compacta con fecha, duración y nº de ejercicios.
  4. **Progreso semanal**: tabla mini con `etiqueta`, `entrenamientos`, `volumenTotal`.

### F3.3 Acciones del cliente
- Header con dropdown: `Editar`, `Desactivar`.
- `Desactivar` → confirm dialog → `DELETE /clientes/:id` → toast con botón `Deshacer` (POST `/commands/undo`).

### F3.4 Estado de carga
- Skeleton de las 4 cards mientras `isLoading`.

---

## Fase F4 — Planes (Factory + State + Prototype en UI)

**Objetivo:** wizard de creación, listado, editor de plan con transiciones de estado y duplicación.

### F4.1 Listado `/workspace/planes`
- `useQuery(['planes'])` → `GET /planes-entrenamiento`.
- Cards en grid con: nombre, tipo (badge), estado (badge con color por estado), nº de ejercicios, fecha de creación.
- Header: botón `Nuevo plan` → `/workspace/planes/nuevo`.

### F4.2 Wizard `/workspace/planes/nuevo`
- Componente `<WizardPlan />` con paso 1 y paso 2 en estado local.
- **Paso 1 — Tipo (Factory):** 3 cards seleccionables con icono y bullet de defaults:
  - **Hipertrofia** — 4×10, 60s descanso.
  - **Fuerza** — 5×5, 180s descanso.
  - **Resistencia** — 3×15, 30s descanso.
  - Botón `Siguiente` deshabilitado hasta elegir.
- **Paso 2 — Datos:** `nombre`, `descripcion`.
- Mutation `POST /planes-entrenamiento` con `{ nombre, descripcion, tipo }`.
- En éxito: navega a `/workspace/planes/<id>`.

### F4.3 Editor `/workspace/planes/[id]`
- Layout: header con nombre, badge de tipo, badge de estado y botones de acción según estado.
- Tabs: `Ejercicios`, `Información`.

### F4.4 Tab Ejercicios
- Tabla de `EjercicioPlan` con columnas: orden, ejercicio, grupo, series, reps, descanso, notas, acciones (eliminar).
- Botón `Agregar ejercicio` → dialog con:
  - `<Select>` de ejercicios del catálogo (query `GET /ejercicios`).
  - Inputs `series`, `repeticiones`, `segundosDeDescanso`, `orden`, `notas`.
  - Mutation `POST /planes-entrenamiento/:id/ejercicios`.
- Eliminar → `DELETE /planes-entrenamiento/:id/ejercicios/:ejercicioPlanId`.
- Bloqueo: si plan ARCHIVADO, deshabilitar agregar/eliminar.

### F4.5 Tab Información
- Form de edición de `nombre`, `descripcion`. Mutation futura (no MVP) o solo lectura.
- Muestra `creadoEn`, `actualizadoEn`.

### F4.6 Botones de transición de estado (State pattern visible)
Layout condicional según `plan.estado`:
- `BORRADOR` → botón `Activar` (deshabilitado si `ejercicios.length === 0`, con tooltip explicativo).
- `ACTIVO` → botón `Archivar`.
- `ARCHIVADO` → sin botones, solo badge.

Cada acción:
- Mutation `PATCH /planes-entrenamiento/:id/activar` o `/archivar`.
- En éxito: invalidar `['planes']` y `['plan', id]`.
- Si `Archivar`: toast con botón `Deshacer` (`POST /commands/undo`).
- Captura `409`/`400` del backend (transición inválida) → toast de error.

### F4.7 Botón "Duplicar" (Prototype)
- En header del editor, siempre visible.
- `POST /planes-entrenamiento/:id/duplicar` → navega al nuevo plan (`/workspace/planes/<nuevoId>`).
- Toast `"Plan duplicado como '<nombre> (copia)'"`.

---

## Fase F5 — Catálogo de ejercicios

**Objetivo:** listar y crear ejercicios. Visualmente sencillo pero es el endpoint con Decorator activo.

### F5.1 Listado `/workspace/ejercicios`
- `useQuery(['ejercicios'])` → `GET /ejercicios`.
- Filtro por grupo muscular con `<Select>` (refetch con clave `['ejercicios', grupo]` y endpoint `/ejercicios/por-grupo/:grupo`).
- Cards con imagen, nombre, badge de grupo, link a video (si existe).

### F5.2 Dialog "Nuevo ejercicio"
- Form: `nombre`, `grupoMuscular` (select del enum), `descripcion`, `instrucciones`, `imagenUrl`, `videoUrl`.
- Mutation `POST /ejercicios`.
- En éxito: invalida `['ejercicios']`. El backend internamente invalida su cache (Decorator).

---

## Fase F6 — Vista del cliente (Builder + Strategy)

**Objetivo:** segmento `(cliente)` con plan asignado, registrar entrenamiento y progreso.

### F6.1 Layout `/cliente`
- `app/(cliente)/layout.tsx` con `useRequireAuth('CLIENTE')`.
- `<SidebarCliente />` con links: `Mi plan` (`/cliente/plan`), `Registrar` (`/cliente/registrar`), `Progreso` (`/cliente/progreso`).
- En el header, componente `<NotificacionesBell />` (ver F7).

### F6.2 `/cliente/plan`
- `useQuery(['mi-plan'])` → `GET /clientes/<miClienteId>/asignaciones` filtrando activas. Para MVP: endpoint propio `GET /cliente/plan-activo` o reuso del dashboard si `clienteId === me`.
- Renderiza el plan activo: nombre, tipo, lista de ejercicios con series/reps/descanso.
- Si no hay plan asignado: empty state.

### F6.3 `/cliente/registrar` — Wizard Builder
- Componente `<WizardRegistro />` con 3 pasos en estado local. **Cada paso refleja un setter del builder.**

**Paso 1 — Datos generales:**
- Inputs: `fecha` (date picker, default hoy), `duracionMin`, `notas`.
- Botón `Siguiente`.

**Paso 2 — Ejercicios:**
- Cargar plan activo y por cada `EjercicioPlan` mostrar una card editable con: `nombre` (readonly), `series`, `repeticiones`, `pesoKg`, `notas`.
- Permitir agregar ejercicios libres con botón `+ Otro ejercicio` (form expandible).
- `react-hook-form` con `useFieldArray` para la lista.
- Botón `Siguiente`.

**Paso 3 — Confirmación:**
- Muestra resumen (fecha, duración, lista de ejercicios).
- Botón `Guardar registro`.
- Mutation `POST /clientes/<miClienteId>/registros-entrenamiento` con el payload completo.
- En éxito: toast, redirige a `/cliente/progreso`.

Estado intermedio del wizard guardado en `useReducer` para poder retroceder sin perder datos.

### F6.4 `/cliente/progreso` — Tabs Strategy
- Tabs shadcn con valores `semanal`, `mensual`, `porPlan`.
- Cambio de tab → cambia query key → `GET /clientes/<miClienteId>/progreso?vista=<valor>`.
- Renderiza tabla con columnas `etiqueta`, `entrenamientos`, `volumenTotal`, `pesoPromedio`.
- Opcional MVP: pequeño bar chart con Tailwind (sin Recharts).

---

## Fase F7 — Notificaciones (Observer visible)

**Objetivo:** el cliente ve en tiempo casi-real las notificaciones disparadas por el observer del backend.

### F7.1 `<NotificacionesBell />`
- `apps/web/src/components/layout/notificaciones-bell.tsx`.
- `useQuery(['notificaciones'], { refetchInterval: 30_000 })` → `GET /notificaciones`.
- Icono campana con badge del conteo de no leídas.
- Dropdown con la lista (últimas 10), cada fila muestra `mensaje`, `creadoEn` (relative time con date-fns).

### F7.2 Marcar leída
- Click en una notificación → mutation `PATCH /notificaciones/:id/leer`.
- Invalida `['notificaciones']`.

### F7.3 Botón "Marcar todas"
- En el footer del dropdown.

---

## Fase F8 — Undo global (Command visible)

**Objetivo:** todo punto del frontend que dispara un Command muestra un toast con acción `Deshacer`.

### F8.1 Helper `toastConUndo`
- `apps/web/src/lib/ui/toast-undo.ts`:
  ```ts
  export function toastConUndo(mensaje: string, onUndo: () => Promise<void>) {
    toast.success(mensaje, {
      action: { label: 'Deshacer', onClick: async () => { await onUndo(); toast.message('Acción deshecha'); } },
      duration: 8000,
    });
  }
  ```

### F8.2 Aplicar en
- `DELETE /clientes/:id` (F3.3): `onUndo = () => apiFetch('/commands/undo', { method: 'POST' })`.
- `PATCH /planes-entrenamiento/:id/archivar` (F4.6).
- `POST /clientes/invitar` (F2.4): aquí el undo cancela la invitación.

### F8.3 Re-fetch tras undo
- Tras `onUndo`, invalidar las queries afectadas (`['clientes']`, `['planes']`, `['invitaciones']`).

---

## Fase F9 — Estados de error, vacíos y carga global

**Objetivo:** experiencia consistente en bordes.

### F9.1 `ErrorBoundary` y `error.tsx`
- `app/error.tsx` y `app/(entrenador)/error.tsx`: muestran un `<Card>` con `Algo salió mal` + botón `Reintentar`.

### F9.2 `not-found.tsx`
- `app/not-found.tsx`: enlace a `/`.

### F9.3 Loaders coherentes
- Audit pasada por todas las páginas → asegurar que toda `useQuery` tenga un skeleton equivalente.

### F9.4 Interceptor de 401
- En `apiFetch`, si `status === 401`: limpiar `localStorage`, redirigir a `/login`.

---

## Fase F10 — QA manual y verificación de patrones desde la UI

**Objetivo:** asegurar que un usuario que recorre la UI dispara todos los patrones del backend.

Checklist manual (debe quedar como `docs/QA_CHECKLIST.md` aparte si se desea, no es obligatorio):

1. Registrar entrenador → llegar a `/workspace`.
2. Invitar cliente → tomar token del toast → registrar cliente en `/invitacion/<token>`.
3. Crear 3 ejercicios → recargar → confirmar respuesta rápida (Decorator).
4. Crear plan tipo `Hipertrofia` → confirmar que el editor muestra series/reps/descanso por defecto correctos (Factory).
5. Activar plan → ver en otra pestaña con la sesión del cliente que aparece la notificación (Observer).
6. Cliente registra entrenamiento via wizard (Builder).
7. Cliente abre `/cliente/progreso` y cambia entre las 3 tabs (Strategy).
8. Entrenador abre `/workspace/clientes/<id>` → ve dashboard (Facade).
9. Entrenador duplica plan → confirma nuevo plan con sufijo `(copia)` (Prototype).
10. Entrenador archiva plan → toast con `Deshacer` → click → plan vuelve a ACTIVO (State + Command).
11. Entrenador desactiva cliente → `Deshacer` → cliente vuelve a activo (Command + Memento).

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
