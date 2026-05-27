# F10 — QA Verification Checklist

## Objetivo
Asegurar que un usuario que recorre la UI dispara todos los patrones del backend.

---

## Patrón 1: Singleton (WorkspaceRegistry + EjerciciosCatalog)

### 1.1 Registrar entrenador → `/workspace`
- [ ] Ir a `/login`
- [ ] Click "Registrarse" → `/register`
- [ ] Llenar formulario: nombre, apellido, correo, contraseña, nombreWorkspace
- [ ] Submit → debe redirigir a `/workspace`
- [ ] Verificar que la sidebar muestra "Clientes", "Planes", "Ejercicios"

**Verificación backend:** El `WorkspaceRegistry` debe tener una entrada para el workspace creado.

---

## Patrón 2: Decorator (CacheEjerciciosDecorator)

### 1.2 Crear 3 ejercicios → confirmar respuesta rápida
- [ ] Ir a `/workspace/ejercicios`
- [ ] Click "Nuevo ejercicio"
- [ ] Crear ejercicio 1: Press de banca, pecho, "Press de banca con barra"
- [ ] Submit → debe responder rápido (cached)
- [ ] Crear ejercicio 2: Sentadilla, piernas, "Sentadilla con barra"
- [ ] Crear ejercicio 3: Peso muerto, espalda, "Peso muerto rumano"
- [ ] Recargar página `/workspace/ejercicios`
- [ ] Verificar que los 3 ejercicios persisten

**Verificación backend:** `CacheEjerciciosDecorator` está envolviendo `EjerciciosServiceImpl`. La segunda carga debe ser significativamente más rápida.

---

## Patrón 3: Factory (PlanesFactory)

### 1.3 Crear plan tipo `Hipertrofia` → verificar defaults
- [ ] Ir a `/workspace/planes`
- [ ] Click "Nuevo plan"
- [ ] Seleccionar tipo `Hipertrofia` (4×10, 60s descanso)
- [ ] Click "Siguiente"
- [ ] Ingresar nombre: "Plan Prueba Hipertrofia"
- [ ] Click "Crear plan"
- [ ] Navega al editor `/workspace/planes/<id>`
- [ ] **VERIFICACIÓN CRÍTICA:** Agregar un ejercicio cualquiera
- [ ] Verificar que los defaults son: series=4, repeticiones=10, segundosDeDescanso=60

**Verificación backend:** `PlanesFactory.crearPlan(TipoPlan.HIPERTROFIA)` debe aplicar los defaults correctos.

---

## Patrón 4: Observer (NotificacionObserver)

### 1.4 Invitar cliente
- [ ] En `/workspace`, click "Invitar cliente"
- [ ] Ingresar correo de prueba: `cliente@test.com`
- [ ] Submit → aparece toast con `tokenInvitacion`
- [ ] Copiar el token

### 1.5 Registrar cliente vía invitación
- [ ] Ir a `/invitacion/<token>` (usar el token del paso anterior)
- [ ] Verificar que el correo está prellenado y deshabilitado
- [ ] Llenar: contraseña, nombre, apellido
- [ ] Submit → debe redirigir a `/cliente/planes`

### 1.6 Activar plan → verificar notificación en cliente
- [ ] En sesión de entrenador, ir a `/workspace/planes`
- [ ] Abrir el plan creado en paso 1.3
- [ ] Agregar al menos 3 ejercicios al plan
- [ ] Click "Activar" (si está deshabilitado, agregar ejercicios primero)
- [ ] **SWITCHEAR A SESIÓN DE CLIENTE**
- [ ] En `/cliente/planes`, verificar que aparece el plan activo
- [ ] Ir a `/cliente/progreso` - verificar que el `NotificacionesBell` muestra badge con nueva notificación

**Verificación backend:** `NotificacionObserver` debe disparar cuando se activa un plan asignado a un cliente.

---

## Patrón 5: Builder (RegistroBuilder)

### 1.7 Cliente registra entrenamiento vía wizard
- [ ] En sesión de cliente, ir a `/cliente/registrar`
- [ ] **Paso 1:** Verificar que fecha default es hoy, duración 60min
- [ ] Click "Siguiente"
- [ ] **Paso 2:** Verificar que aparecen los ejercicios del plan asignado
- [ ] Editar series/repeticiones/peso de al menos 2 ejercicios
- [ ] Click "Siguiente"
- [ ] **Paso 3:** Verificar resumen con fecha, duración y lista de ejercicios
- [ ] Click "Guardar registro"
- [ ] Toast de éxito → redirige a `/cliente/progreso`

**Verificación backend:** `RegistroBuilder.build()` debe crear el `RegistroDeEntrenamiento` con todos los ejercicios.

---

## Patrón 6: Strategy (ProgresoStrategy)

### 1.8 Cliente cambia entre 3 tabs en `/cliente/progreso`
- [ ] En `/cliente/progreso`, verificar que tabs muestran: "Semanal", "Mensual", "Por plan"
- [ ] Click en "Semanal" → verificar que datos cargan
- [ ] Click en "Mensual" → verificar que la query cambia a `?vista=mensual`
- [ ] Click en "Por plan" → verificar que la query cambia a `?vista=porPlan`

**Verificación backend:** El backend debe retornar datos agregados según la estrategia solicitada.

---

## Patrón 7: Facade (ClienteDashboardFacade)

### 1.9 Entrenador ve dashboard del cliente
- [ ] En sesión de entrenador, ir a `/workspace`
- [ ] Click en fila de algún cliente → `/workspace/clientes/<id>`
- [ ] **VERIFICACIÓN:** Ver 4 tarjetas:
  - Perfil: nombre, correo, estado, fecha de alta
  - Plan activo: nombre, tipo, nº ejercicios, botón "Ver plan"
  - Últimos registros: lista de 5 con fecha, duración
  - Progreso semanal: tabla con etiqueta, entrenamientos, volumen

**Verificación backend:** `ClienteDashboardFacade.obtenerDashboard()` debe aggregatear datos de múltiples servicios.

---

## Patrón 8: Prototype (PlanesPrototype)

### 1.10 Duplicar plan
- [ ] En editor de plan `/workspace/planes/<id>`, click botón "Duplicar"
- [ ] Toast: "Plan duplicado como '<nombre> (copia)'"
- [ ] Navega al nuevo plan
- [ ] **VERIFICACIÓN:** El nombre del nuevo plan tiene sufijo "(copia)"

**Verificación backend:** `PlanesPrototype.duplicar()` debe copiar todos los `EjercicioPlan`.

---

## Patrón 9: State + Command (Transiciones + CommandInvoker)

### 1.11 Archivar plan con undo
- [ ] En editor de plan activo, click "Archivar"
- [ ] **VERIFICACIÓN:** Toast con botón "Deshacer" aparece
- [ ] Click "Deshacer" dentro de 8 segundos
- [ ] **VERIFICACIÓN:** Plan vuelve a estado ACTIVO
- [ ] Toast "Acción deshecha"

**Verificación backend:**
- `PlanEstadoMachine` debe manejar transiciones BORRADOR→ACTIVO→ARCHIVADO
- `CommandInvokerService` debe registrar el comando de архивацию
- `POST /commands/undo` debe revertir

---

## Patrón 10: Command + Memento (Desactivar cliente con undo)

### 1.12 Desactivar cliente con undo
- [ ] En `/workspace/clientes/<id>`, click en dropdown "..."
- [ ] Click "Desactivar"
- [ ] Dialog de confirmación aparece
- [ ] Click "Desactivar"
- [ ] **VERIFICACIÓN:** Toast con botón "Deshacer" aparece
- [ ] Click "Deshacer"
- [ ] **VERIFICACIÓN:** Cliente vuelve a estado ACTIVO

**Verificación backend:**
- `DesactivarClienteCommand` debe cambiar `estaActivo = false`
- `Memento` debe guardar estado anterior para permitir undo
- `CommandInvokerService` debe registrar el comando

---

## Resumen de Patrones Verificados

| # | Patrón | Elemento UI | Verificado |
|---|--------|-------------|------------|
| 1 | Singleton | Registro/Login → Workspace | [ ] |
| 2 | Decorator | Catálogo de ejercicios | [ ] |
| 3 | Factory | Wizard de creación de plan | [ ] |
| 4 | Observer | Notificación al activar plan | [ ] |
| 5 | Builder | Wizard de registro de entrenamiento | [ ] |
| 6 | Strategy | Tabs de progreso | [ ] |
| 7 | Facade | Dashboard del cliente | [ ] |
| 8 | Prototype | Botón duplicar plan | [ ] |
| 9 | State + Command | Archivar plan con undo | [ ] |
| 10 | Command + Memento | Desactivar cliente con undo | [ ] |

---

## Notas
- Para probar en diferentes sesiones: usar modo incógnito o cerrar sesión y abrir otra cuenta
- Verificar que el token de invitación expira después de su uso
- Confirmar que el Decorator de ejercicios responde más rápido en segunda carga (revisar logs del backend)