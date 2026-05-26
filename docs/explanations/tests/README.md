# Tests del backend

223 tests en 48 archivos `*.spec.ts`, todos en verde.

```bash
pnpm --filter api test
pnpm --filter api test -- src/path/to/file.spec.ts
pnpm --filter api test -- -t "nombre del test"
```

## Núcleo (Command, registry, common)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `commands/command-invoker.service.spec.ts` | 5 | Historial como pila, undo del último, límite 50, fallo no entra al historial, copia del historial |
| `modules/registry/workspace.registry.spec.ts` | 5 | Instancia única, copia defensiva, búsqueda, desconocido → `undefined` |
| `modules/registry/ejercicios.catalog.spec.ts` | 4 | Carga, recarga limpia el estado anterior, copia defensiva |
| `common/guards/workspace.guard.spec.ts` | 10 | Sin workspace → `Forbidden`, fallback al registry (sin doble consulta), workspace inexistente, ownership de recursos, camino feliz |
| `common/guards/roles.guard.spec.ts` | 4 | Sin roles declarados → pasa, rol correcto → pasa, rol insuficiente → `Forbidden` |
| `common/filters/http-exception.filter.spec.ts` | 5 | Normaliza a `{ statusCode, mensaje, error }` para `HttpException`, validación con array, error genérico → 500 |
| `common/utils/slugify.spec.ts` | 6 | Minúsculas + guiones, diacríticos, caracteres consecutivos, guiones extremos, números, cadena vacía |

## Auth y usuarios

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/auth/auth.service.spec.ts` | 17 | `registrarCliente` (invitación inválida, correo duplicado, camino feliz), `registrarEntrenador` (colisión de slugs, camino feliz), `login` (credenciales, resolución de `workspaceId` por rol) |
| `modules/auth/auth.controller.spec.ts` | 6 | Validación de DTOs → 400, whitelist elimina campos extra, respuesta envuelta en `{ data }` |
| `modules/usuarios/repositories/usuarios.repository.spec.ts` | 4 | Queries y `conTransaccion` delega en `prisma.$transaction` |
| `modules/invitaciones/controllers/invitaciones.controller.spec.ts` | 4 | Token inexistente / consumida / expirada / válida |

## Clientes (Memento + Command)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/clientes/services/clientes.service.spec.ts` | 11 | CRUD con tenancy, `softDelete` guarda snapshot, `restaurar` consume memento, ramas `NotFound`/`Forbidden` |
| `modules/clientes/controllers/clientes.controller.spec.ts` | 6 | Delegación al `CommandInvoker` y construcción correcta de cada `Command` |
| `modules/clientes/commands/desactivar-cliente.command.spec.ts` | 4 | `execute` → `softDelete`, `undo` → `restaurar`, undo sin execute no falla, `descripcion()` |
| `modules/clientes/commands/invitar-cliente.command.spec.ts` | 2 | `execute` crea invitación y envía email, `undo` marca invitación como consumida |
| `modules/clientes/memento/cliente.memento.spec.ts` | 2 | Snapshot inmutable, copia defensiva del timestamp |
| `modules/clientes/memento/cliente-container.spec.ts` | 4 | Pila LIFO, historiales independientes por cliente, vacío → `null` |
| `modules/clientes/repositories/clientes.repository.spec.ts` | 4 | Queries filtradas por `workspaceId` |

## Ejercicios (Decorator + cache)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/ejercicios/decorators/cache-ejercicios.decorator.spec.ts` | 6 | Cache hit/miss en `findAll`/`findById`/`findByGrupo`, `create` invalida todo, `null` no se cachea |
| `modules/ejercicios/repositories/ejercicios.repository.spec.ts` | 4 | Queries de ejercicios |

## Planes de entrenamiento (Factory + State + Prototype + Observer + Command)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/planes-entrenamiento/services/planes-entrenamiento.service.spec.ts` | 6 | `crear` elige factory y persiste en borrador, `findById` (`NotFound`/`Forbidden`), `activar` delega al state, `duplicar` clona snapshot, `agregarEjercicio` notifica si está activo |
| `modules/planes-entrenamiento/controllers/planes-entrenamiento.controller.spec.ts` | 5 | Crear/listar por usuario y workspace, activar, archivar vía `CommandInvoker` con `ArchivarPlanCommand`, agregar ejercicio |
| `modules/planes-entrenamiento/repositories/planes-entrenamiento.repository.spec.ts` | 8 | Crear, listar por workspace con ejercicios, cargar con ejercicios ordenados, `updateEstado`, agregar/quitar ejercicio, contar, `crearDesdeClone` |
| `modules/planes-entrenamiento/factories/fuerza.factory.spec.ts` | 1 | Draft con defaults de fuerza |
| `modules/planes-entrenamiento/factories/hipertrofia.factory.spec.ts` | 1 | Draft con defaults de hipertrofia |
| `modules/planes-entrenamiento/factories/resistencia.factory.spec.ts` | 1 | Draft con defaults de resistencia |
| `modules/planes-entrenamiento/states/borrador.state.spec.ts` | 3 | Activar sin ejercicios falla, activar con ejercicios → `ActivoState` y notifica, archivar falla |
| `modules/planes-entrenamiento/states/activo.state.spec.ts` | 2 | Archivar → `ArchivadoState` y notifica, activar falla |
| `modules/planes-entrenamiento/states/archivado.state.spec.ts` | 2 | Activar y archivar fallan (estado terminal) |
| `modules/planes-entrenamiento/prototypes/plan.prototype.spec.ts` | 1 | `clone` genera objeto nuevo con ids vacíos y sufijo "(copia)" |
| `modules/planes-entrenamiento/observers/plan-subject.spec.ts` | 3 | `subscribe`/`notify` por plan correcto, `unsubscribe` corta eventos futuros, `notify` espera observers async |
| `modules/planes-entrenamiento/observers/cliente.observer.spec.ts` | 2 | Persiste notificación con mensaje según evento, usa `clienteId` del evento |
| `modules/planes-entrenamiento/observers/email-notification.observer.spec.ts` | 1 | Invoca mailer con el template de cambio de plan |
| `modules/planes-entrenamiento/commands/archivar-plan.command.spec.ts` | 5 | `execute` guarda estado previo y archiva, `undo` restaura según estado previo (ACTIVO/BORRADOR), undo sin execute no falla, `descripcion()` |

## Asignaciones (Observer)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/asignaciones/services/asignaciones.service.spec.ts` | 5 | `asignarEntrenamiento` valida cliente/plan, crea y suscribe observers, ramas `NotFound`/`Forbidden`/`BadRequest` (plan no activo), `cambiarEstado` delega |
| `modules/asignaciones/controllers/asignaciones.controller.spec.ts` | 3 | Asignar con workspace actual, listar por cliente, cambiar estado |
| `modules/asignaciones/repositories/asignaciones-entrenamiento.repository.spec.ts` | 5 | Crear (activa por defecto), filtrar por cliente/plan, `updateEstado`, asignación activa más reciente |

## Notificaciones

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/notificaciones/services/notificaciones.service.spec.ts` | 3 | No leídas del cliente del usuario, `NotFound` si el usuario no tiene cliente, `marcarLeida` delega |
| `modules/notificaciones/controllers/notificaciones.controller.spec.ts` | 2 | Listar no leídas del usuario autenticado, marcar como leída |
| `modules/notificaciones/repositories/notificaciones.repository.spec.ts` | 3 | Crear, `findNoLeidasPorCliente` (filtra `leida=false`), `marcarLeida` |

## Registros de entrenamiento (Builder)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/registros/builders/registro-entrenamiento.builder.spec.ts` | 3 | `build` sin ejercicios falla, con ejercicios construye objeto correcto, copia defensiva de ejercicios |
| `modules/registros/services/registros.service.spec.ts` | 6 | `registrar` valida workspace + builder + persiste, ramas `NotFound`/`Forbidden`/`BadRequest`, omite opcionales, `listar` delega filtros |
| `modules/registros/repositories/registros-entrenamiento.repository.spec.ts` | 5 | `crearConEjercicios` (una operación, respeta `tx`), `listarPorCliente` (paginación + filtros de fecha), detalle con ejercicios |

## Progreso (Strategy)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/progreso/services/progreso.service.spec.ts` | 7 | Selección de strategy por `vista` (semanal/mensual/porPlan), contexto de asignaciones solo para `porPlan`, retorna resultado de la strategy, `setEstrategia` permite inyección |
| `modules/progreso/strategies/progreso-semanal.strategy.spec.ts` | 6 | Agrupa por semana ISO, separa semanas, acumula totales, `totalSesiones` global, orden ascendente, vacío → sin periodos |
| `modules/progreso/strategies/progreso-mensual.strategy.spec.ts` | 7 | Agrupa por mes, separa meses, mes con cero a la izquierda, acumula totales, `totalSesiones` global, orden ascendente, vacío → sin periodos |
| `modules/progreso/strategies/progreso-por-plan.strategy.spec.ts` | 6 | Asigna registros al plan según fecha de cambio, agrupa dos planes, "Sin plan asignado" sin contexto o anterior a toda asignación, `totalSesiones` global |

## Dashboard (Facade)

| Archivo | Tests | Qué prueba |
|---|---|---|
| `modules/dashboard/cliente-dashboard.facade.spec.ts` | 8 | Llama a todos los servicios con parámetros correctos, compone los cuatro bloques, cliente/plan activo (con `null`), últimos 5 registros, progreso semanal, ejecución en paralelo (`Promise.all`) |
