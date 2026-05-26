# Tests del backend

113 tests en 20 archivos `*.spec.ts`, todos en verde.

```bash
pnpm --filter api test
pnpm --filter api test -- src/path/to/file.spec.ts
pnpm --filter api test -- -t "nombre del test"
```

## Archivos y qué prueban

| Archivo | Tests | Qué prueba |
|---|---|---|
| `commands/command-invoker.service.spec.ts` | 5 | Historial como pila, undo del último, límite 50, fallo no entra al historial, copia del historial |
| `modules/auth/auth.service.spec.ts` | 17 | `registrarCliente` (invitación inválida, correo duplicado, camino feliz), `registrarEntrenador` (colisión de slugs, camino feliz), `login` (credenciales, resolución de `workspaceId` por rol) |
| `modules/auth/auth.controller.spec.ts` | 6 | Validación de DTOs → 400, whitelist elimina campos extra, respuesta envuelta en `{ data }` |
| `modules/clientes/services/clientes.service.spec.ts` | 11 | CRUD con tenancy, `softDelete` guarda snapshot, `restaurar` consume memento, ramas `NotFound`/`Forbidden` |
| `modules/clientes/controllers/clientes.controller.spec.ts` | 6 | Delegación al `CommandInvoker` y construcción correcta de cada `Command` |
| `modules/clientes/commands/desactivar-cliente.command.spec.ts` | 4 | `execute` → `softDelete`, `undo` → `restaurar`, undo sin execute no falla, `descripcion()` |
| `modules/clientes/commands/invitar-cliente.command.spec.ts` | 2 | `execute` crea invitación y envía email, `undo` marca invitación como consumida |
| `modules/clientes/memento/cliente.memento.spec.ts` | 2 | Snapshot inmutable, copia defensiva del timestamp |
| `modules/clientes/memento/cliente-container.spec.ts` | 4 | Pila LIFO, historiales independientes por cliente, vacío → `null` |
| `modules/clientes/repositories/clientes.repository.spec.ts` | 4 | Queries filtradas por `workspaceId` |
| `modules/ejercicios/decorators/cache-ejercicios.decorator.spec.ts` | 6 | Cache hit/miss en `findAll`/`findById`/`findByGrupo`, `create` invalida todo, `null` no se cachea |
| `modules/ejercicios/repositories/ejercicios.repository.spec.ts` | 4 | Queries de ejercicios |
| `modules/invitaciones/controllers/invitaciones.controller.spec.ts` | 4 | Token inexistente / consumida / expirada / válida |
| `modules/registry/workspace.registry.spec.ts` | 5 | Instancia única, copia defensiva, búsqueda, desconocido → `undefined` |
| `modules/registry/ejercicios.catalog.spec.ts` | 4 | Carga, recarga limpia el estado anterior, copia defensiva |
| `modules/usuarios/repositories/usuarios.repository.spec.ts` | 4 | Queries y `conTransaccion` delega en `prisma.$transaction` |
| `common/guards/workspace.guard.spec.ts` | 10 | Sin workspace → `Forbidden`, fallback al registry (sin doble consulta), workspace inexistente, ownership de recursos, camino feliz |
| `common/guards/roles.guard.spec.ts` | 4 | Sin roles declarados → pasa, rol correcto → pasa, rol insuficiente → `Forbidden` |
| `common/filters/http-exception.filter.spec.ts` | 5 | Normaliza a `{ statusCode, mensaje, error }` para `HttpException`, validación con array, error genérico → 500 |
| `common/utils/slugify.spec.ts` | 6 | Minúsculas + guiones, diacríticos, caracteres consecutivos, guiones extremos, números, cadena vacía |
