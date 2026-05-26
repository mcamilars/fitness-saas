# Tests del backend — alcance y por qué

Este documento describe **qué prueba la suite de tests del backend**, con qué **alcance** y, sobre todo, **por qué** está planteada así. Es un proyecto académico de patrones de diseño, por lo que los tests no solo verifican comportamiento: también sirven para **dejar visible que cada patrón funciona como se diseñó** (undo del Command, copias defensivas de los Singletons, invalidación del Decorator, reversibilidad del Memento, etc.).

A día de hoy la suite tiene **113 tests** repartidos en **20 archivos `*.spec.ts`**, todos en verde.

## Cómo correr los tests

```bash
pnpm --filter api test            # toda la suite (jest)
pnpm --filter api test:watch      # modo watch
pnpm --filter api test:cov        # con cobertura

# un archivo o un caso concreto
pnpm --filter api test -- src/modules/auth/auth.service.spec.ts
pnpm --filter api test -- -t "nombre del test"
```

Jest descubre los tests con `testRegex: .*\.spec\.ts$`, es decir, **los specs viven junto al código** que prueban, no en una carpeta `test/` aparte.

## Convenciones y filosofía

Estas reglas explican el **por qué** transversal de casi todos los specs:

1. **Se mockean repositorios, no Prisma.** Los servicios, comandos, guards, etc. reciben dobles de prueba de sus repositorios. Solo los specs *de repositorio* mockean `PrismaService`. Esto es coherente con la regla del proyecto: Prisma solo se toca dentro de `repositories/`, así que el resto del código nunca debería “ver” Prisma ni siquiera en los tests.
2. **Cada `*.spec.ts` está al lado de su archivo.** Facilita encontrarlo y refleja la estructura modular.
3. **Se prueba el contrato, no la implementación interna.** Por ejemplo, en los servicios se verifica qué método del repositorio se llamó y con qué argumentos (incluido el `workspaceId` de tenancy), no cómo arma la query Prisma.
4. **Las ramas de error son ciudadanas de primera clase.** Cada excepción que el código lanza explícitamente (`NotFound`, `Forbidden`, `Unauthorized`, `Conflict`, `BadRequest`) tiene su propio caso. En un backend multi-tenant, el camino de error *es* la regla de seguridad.
5. **Las propiedades intencionales de cada patrón se prueban como tales.** Si el `CLAUDE.md` dice que un Singleton devuelve copias defensivas, hay un test que muta lo devuelto y comprueba que el estado interno no cambió.

## Alcance global y qué NO se cubre

| Tipo | Estado |
|---|---|
| Unitarios (servicios, comandos, memento, repos, guards, filtro, utilidades, singletons) | ✅ La mayoría de la suite |
| Integración liviana con Nest (HTTP + pipe/interceptor/filtro, servicio mockeado) | ✅ Solo `auth.controller.spec.ts` |
| **End‑to‑end reales** (app completa contra Postgres, JWT real, guards encadenados, flujo invitación→registro→login) | ❌ **No existen** |

> El script `test:e2e` existe en `package.json`, pero apunta a `./test/jest-e2e.json`, un archivo que **no existe**; la carpeta `test/` está vacía. Hoy ese comando fallaría. No hay ningún `*.e2e-spec.ts`.

Tampoco se prueban (decisión consciente, bajo valor): `EjerciciosServiceImpl` (passthrough puro al repo), `TransformInterceptor`, `JwtStrategy`, `MailerService` ni los repos `entrenadores`/`espacios-de-trabajo`/`invitaciones` (queries triviales sin lógica).

## Resumen por archivo

| Archivo | Tests | Capa | Qué prueba en una línea |
|---|---|---|---|
| `commands/command-invoker.service.spec.ts` | 5 | Patrón Command | Historial, undo del último, límite 50, fallo no entra al historial, copia del historial |
| `modules/auth/auth.service.spec.ts` | 17 | Servicio | `registrarCliente`, `registrarEntrenador` y `login` con todas sus ramas |
| `modules/auth/auth.controller.spec.ts` | 6 | Integración HTTP | Validación de DTOs y *whitelist* en los 3 endpoints |
| `modules/clientes/services/clientes.service.spec.ts` | 11 | Servicio + Memento | CRUD con tenancy y reversibilidad, todas las ramas de error |
| `modules/clientes/controllers/clientes.controller.spec.ts` | 6 | Controller | Delegación y armado correcto de los Command |
| `modules/clientes/commands/desactivar-cliente.command.spec.ts` | 4 | Patrón Command | `execute`/`undo`/`descripcion` |
| `modules/clientes/commands/invitar-cliente.command.spec.ts` | 2 | Patrón Command | Crear invitación + email, y undo |
| `modules/clientes/memento/cliente.memento.spec.ts` | 2 | Patrón Memento | Inmutabilidad y copia defensiva del timestamp |
| `modules/clientes/memento/cliente-container.spec.ts` | 4 | Patrón Memento | Pila LIFO, historiales por cliente, vacío → null |
| `modules/clientes/repositories/clientes.repository.spec.ts` | 4 | Repositorio | Queries con filtro de workspace |
| `modules/ejercicios/decorators/cache-ejercicios.decorator.spec.ts` | 6 | Patrón Decorator | Cache hit/miss, null no se cachea, invalidación |
| `modules/ejercicios/repositories/ejercicios.repository.spec.ts` | 4 | Repositorio | Queries de ejercicios |
| `modules/invitaciones/controllers/invitaciones.controller.spec.ts` | 4 | Controller | Verificación de token (inexistente/consumida/expirada/válida) |
| `modules/registry/workspace.registry.spec.ts` | 5 | Patrón Singleton | Instancia única, copia defensiva, búsqueda |
| `modules/registry/ejercicios.catalog.spec.ts` | 4 | Patrón Singleton | Carga, recarga que limpia, copia defensiva |
| `modules/usuarios/repositories/usuarios.repository.spec.ts` | 4 | Repositorio | Queries y `conTransaccion` |
| `common/guards/workspace.guard.spec.ts` | 10 | Guard (tenancy) | Workspace, fallback al registry, ownership de recursos |
| `common/guards/roles.guard.spec.ts` | 4 | Guard (autorización) | Roles requeridos vs rol del usuario |
| `common/filters/http-exception.filter.spec.ts` | 5 | Filtro | Normalización de errores a `{ statusCode, mensaje, error }` |
| `common/utils/slugify.spec.ts` | 6 | Utilidad | Normalización de texto a slug |

---

## Detalle por módulo

### Patrón Command — `CommandInvokerService`

**Alcance.** Ejecuta varios comandos y verifica que el historial sea una pila, que `deshacerUltimo()` revierta *solo* el último, que un historial vacío no rompa, que el tamaño quede acotado a 50 descartando el más antiguo, que un comando que falla al ejecutar **no** quede registrado, y que `getHistorial()` devuelva una copia.

**Por qué.** El undo y el historial acotado son la razón de ser del patrón aquí. El caso “falla al ejecutar → no entra al historial” protege contra un undo que intentaría revertir algo que nunca pasó (el `push` está después del `await execute()`, y este test lo fija como contrato).

### Servicio — `AuthService`

**Alcance.** Cubre los tres flujos:
- `registrarCliente`: invitación inexistente/consumida/expirada, correo que no coincide, correo ya registrado, workspace sin entrenador, y el camino feliz (crea usuario+cliente en transacción, marca la invitación, firma el token).
- `registrarEntrenador`: correo duplicado, **colisión de slug** (`base` → `base-2` → `base-3`), nombre que no produce slug válido, y el camino feliz en transacción.
- `login`: correo inexistente, contraseña incorrecta, y `resolverWorkspaceId` ramificado por rol (entrenador vs cliente), incluyendo los dos casos en que el usuario no tiene workspace asociado.

**Por qué.** Es el módulo con más lógica de negocio y de seguridad. El `workspaceId` que se mete en el JWT determina toda la tenancy posterior, así que cada rama que lo resuelve o lo rechaza tiene que estar fijada. La colisión de slugs es lógica algorítmica real (un bucle), no un passthrough.

### Integración HTTP — `AuthController`

**Alcance.** Levanta una app de prueba con `Test.createTestingModule` + `supertest` y la **misma** configuración global que `main.ts` (prefijo `/api`, `ValidationPipe` con `whitelist`, `TransformInterceptor`, `HttpExceptionFilter`). Verifica que un payload inválido devuelve 400 con la lista de mensajes, que se eliminan campos extra (`whitelist`), y que la respuesta válida llega envuelta en `{ data: ... }`.

**Por qué.** Es el único punto donde se prueba el *stack* HTTP de verdad (pipe + interceptor + filtro juntos). Confirma que las convenciones globales del proyecto se aplican de punta a punta sobre un endpoint real, aunque el servicio esté mockeado.

### Servicio + Memento — `ClientesService`

**Alcance.** Listar/buscar/actualizar con validación de workspace, `softDelete` que guarda snapshot antes de desactivar, y `restaurar` que consume el último memento. Ramas de error: `findById` → `NotFound`/`Forbidden`, `update` y `softDelete` → `NotFound` cuando el repo devuelve `null`, y `restaurar` → `Forbidden` cuando el snapshot pertenece a otro workspace.

**Por qué.** Aquí se cruzan tenancy (multi-tenant) y el patrón Memento. El caso `Forbidden` en `restaurar` es especialmente importante: evita que un undo restaure un cliente “cruzando” workspaces, que sería un agujero de aislamiento entre inquilinos.

### Controller — `ClientesController`

**Alcance.** Los seis endpoints. En `softDelete` e `invitar`, el `CommandInvoker` mockeado **ejecuta de verdad** el comando, de modo que el test comprueba que el controller construye el `Command` correcto (`expect.any(DesactivarClienteCommand)` / `InvitarClienteCommand`) y que ese comando delega en el servicio/repositorio adecuado.

**Por qué.** El valor del controller no es su lógica (es delgado), sino el **cableado del patrón Command**: que las operaciones reversibles pasen por el invoker y no se ejecuten directo. Eso es justo lo que se fija.

### Patrón Command — comandos de cliente

**Alcance.** `DesactivarClienteCommand`: `execute` delega en `softDelete`, `undo` llama a `restaurar`, `undo` sin `execute` previo no hace nada, y `descripcion()` describe la operación. `InvitarClienteCommand`: `execute` crea la invitación y dispara el correo, `undo` marca la invitación como consumida.

**Por qué.** Son las implementaciones concretas del contrato `Command`. El test de “undo sin execute” fija que el comando es seguro de revertir aunque nunca se haya ejecutado.

### Patrón Memento — `ClienteMemento` y `ClienteContainer`

**Alcance.** El memento congela el snapshot (no se puede mutar) y devuelve copias defensivas del timestamp. El container funciona como pila LIFO, mantiene historiales independientes por cliente, y devuelve `null` cuando no hay historial o tras agotarlo.

**Por qué.** La esencia del Memento es que el estado guardado **no se pueda corromper desde fuera**. Los tests de inmutabilidad/copia defensiva verifican exactamente esa propiedad, no solo que “guarda y devuelve”.

### Patrón Decorator — `CacheEjerciciosDecorator`

**Alcance.** `findAll`/`findById`/`findByGrupo` cachean (segunda llamada no toca el `impl`), `create` invalida todo el cache, `invalidate(key)` borra solo una clave, y un resultado `null` de `findById` **no** se cachea.

**Por qué.** El Decorator añade caché de forma transparente al servicio real. El caso “null no se cachea” evita memorizar un “no existe” que podría crearse justo después; el de `create` que invalida demuestra la coherencia del cache tras una escritura.

### Patrón Singleton — `WorkspaceRegistry` y `EjerciciosCatalog`

**Alcance.** `getInstance()` devuelve siempre la misma referencia; registrar/buscar funciona; `buscar` desconocido → `undefined`; **copias defensivas** (mutar lo devuelto o el objeto registrado no altera el estado interno); y en el catálogo, `cargarDesde` reemplaza el contenido en cada recarga.

**Por qué.** Estos Singletons son cachés en memoria, **no** la fuente de verdad (lo es la BD). Por eso importa que devuelvan copias (nadie debe mutar su estado interno por accidente) y que recargar limpie lo anterior (no acumular datos viejos).

### Guards — `WorkspaceGuard` y `RolesGuard`

**Alcance.** `WorkspaceGuard`: usuario sin workspace → `Forbidden`; **fallback al registry** consultando la BD cuando el workspace no está cacheado (y no reconsulta si ya está); workspace inexistente → `Forbidden`; sin metadata de ownership → pasa; falta el id del recurso → `Forbidden`; recurso inexistente → `NotFound`; recurso de otro workspace → `Forbidden`; camino feliz → pasa. `RolesGuard`: sin roles declarados o lista vacía → pasa; rol incluido → pasa; rol insuficiente → `Forbidden`.

**Por qué.** Son la columna vertebral del **aislamiento entre inquilinos** y de la autorización. Cada rama representa una decisión de seguridad; si una falla, se filtra acceso entre workspaces o entre roles. El fallback al registry también demuestra la integración Singleton ↔ repositorio descrita en el `CLAUDE.md`.

### Filtro — `HttpExceptionFilter`

**Alcance.** Normaliza a `{ statusCode, mensaje, error }`: `HttpException` con respuesta string, con respuesta objeto (incluido el `mensaje: string[]` de validación), objeto sin `error` (usa el nombre de la excepción), `Error` genérico → 500 con su mensaje, y cualquier cosa que no sea `Error` → defaults 500.

**Por qué.** Es el contrato de error que consume el frontend. Fijar la forma de la respuesta para cada tipo de excepción evita romper a los clientes ante cambios internos.

### Utilidad — `slugify`

**Alcance.** Minúsculas + guiones, eliminación de diacríticos (tildes/eñes), colapso de no-alfanuméricos consecutivos, recorte de guiones extremos, números conservados, y cadena vacía cuando no quedan caracteres válidos.

**Por qué.** Genera los slugs de workspace, que deben ser únicos y estables. El caso de cadena vacía es el que dispara el `ConflictException` en `AuthService.registrarEntrenador`, así que ambos tests se complementan.

### Repositorios — `clientes`, `ejercicios`, `usuarios`

**Alcance.** Verifican que cada método arma la query Prisma esperada (filtros, `include`, `orderBy`) y, en escrituras, que usan el cliente de transacción (`tx`) cuando se provee y el `prisma` por defecto cuando no. En `usuarios` se prueba además que `conTransaccion` delega en `prisma.$transaction` y propaga el resultado del callback.

**Por qué.** Los repositorios son la **única** capa autorizada a tocar Prisma. El soporte de `tx` y el helper `conTransaccion` son la base de las transacciones cross-entity (registro de entrenador/cliente); por eso se prueban explícitamente aunque el resto del código se haga con mocks.

---

## Resumen

La suite prioriza **comportamiento de negocio, seguridad multi-tenant y las propiedades intencionales de cada patrón**, mockeando repositorios y reservando Prisma para los specs de repositorio. Hay una capa de integración HTTP solo en auth y **no hay tests end‑to‑end**: el siguiente paso natural, si se quisiera, sería montar `test/jest-e2e.json` y un `app.e2e-spec.ts` que arranque la app real contra Postgres para validar el flujo completo invitación → registro → login con guards y JWT reales.
