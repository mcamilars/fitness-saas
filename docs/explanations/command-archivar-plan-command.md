# Patrón Command — ArchivarPlanCommand

> Este documento complementa [`command-command-invoker-service.md`](./command-command-invoker-service.md), que explica la infraestructura base del patrón Command en este proyecto. Aquí se describe el tercer comando concreto implementado: `ArchivarPlanCommand`.

## Qué hace este comando

`ArchivarPlanCommand` encapsula la acción de archivar un plan de entrenamiento de forma reversible. El aspecto clave es que, antes de archivar, guarda el estado en que estaba el plan. Si el plan estaba `ACTIVO`, el comando sabe cómo devolverlo a ese estado en un `undo()`.

## Partes implementadas

### 1. `ArchivarPlanCommand`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/commands/archivar-plan.command.ts
```

El comando implementa la interfaz `Command<PlanConEjercicios>`:

```ts
export class ArchivarPlanCommand implements Command<PlanConEjercicios> {
  private estadoPrevio?: EstadoPlan;

  constructor(
    private readonly planesService: PlanesEntrenamientoService,
    private readonly planId: string,
    private readonly workspaceId: string,
  ) {}
  ...
}
```

El campo `estadoPrevio` es la pieza que habilita el undo. No se recibe en el constructor porque aún no se conoce al momento de construir el comando; se captura durante `execute()`.

**`execute()`:**

```ts
async execute(): Promise<PlanConEjercicios> {
  const plan = await this.planesService.findById(this.planId, this.workspaceId);
  this.estadoPrevio = plan.estado as EstadoPlan;
  return this.planesService.archivar(this.planId, this.workspaceId);
}
```

Primero carga el plan para capturar su estado actual, luego lo archiva. Si el plan ya estaba `ARCHIVADO`, el propio `ActivoState`/`BorradorState` del patrón State lanzará una excepción antes de llegar al undo, por lo que ese caso nunca llega a persistirse en el historial.

**`undo()`:**

```ts
async undo(): Promise<void> {
  if (this.estadoPrevio !== EstadoPlan.ACTIVO) {
    return;
  }
  await this.planesService.activar(this.planId, this.workspaceId);
}
```

El undo es condicional: solo tiene sentido reactivar el plan si antes estaba `ACTIVO`. Si el plan venía de `BORRADOR`, no existe transición inversa válida (el patrón State impide activar un plan sin ejercicios de forma incorrecta), por lo que el método simplemente no hace nada.

### 2. Integración en el controller de planes

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/controllers/planes-entrenamiento.controller.ts
```

El endpoint `PATCH /:id/archivar` ya existía, pero llamaba directamente al servicio. En B8.6 se migró para que pase por el `CommandInvoker`, igual que `DELETE /clientes/:id` con `DesactivarClienteCommand`:

```ts
@Patch(':id/archivar')
archivar(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
  const command = new ArchivarPlanCommand(
    this.planesEntrenamientoService,
    id,
    workspaceId,
  );
  return this.commandInvoker.ejecutar(command);
}
```

El controller instancia el comando con los datos del request y se lo entrega al invoker. No sabe nada sobre `estadoPrevio`, ni sobre la lógica de reversión.

## Diferencia con los otros comandos

| Comando | `undo()` revierte |
|---|---|
| `InvitarClienteCommand` | Marca la invitación como consumida |
| `DesactivarClienteCommand` | Reactiva el cliente via `restaurar()` |
| `ArchivarPlanCommand` | Reactiva el plan, pero solo si estaba `ACTIVO` |

La novedad de `ArchivarPlanCommand` frente a los otros dos es que su `undo()` es **condicional**: lee `estadoPrevio` para decidir si la reversión tiene sentido. Esto lo hace más conservador: nunca intenta una transición de estado que el patrón State rechazaría.

## Flujo de archivado reversible

Cuando se llama:

```http
PATCH /api/planes-entrenamiento/:id/archivar
```

ocurre este flujo:

```txt
PlanesEntrenamientoController
  └── crea ArchivarPlanCommand(planesService, planId, workspaceId)
        └── CommandInvokerService.ejecutar(command)
              └── command.execute()
                    ├── PlanesEntrenamientoService.findById()  ← captura estadoPrevio
                    └── PlanesEntrenamientoService.archivar()  ← State transition → ARCHIVADO
              └── guarda command en historial
```

Luego, si se llama:

```http
POST /api/commands/undo
```

ocurre este flujo:

```txt
CommandsController
  └── CommandInvokerService.deshacerUltimo()
        └── toma el último command del historial
        └── command.undo()
              ├── si estadoPrevio === ACTIVO →
              │     PlanesEntrenamientoService.activar()  ← State transition → ACTIVO
              └── si estadoPrevio !== ACTIVO → no-op
```

## Resumen

`ArchivarPlanCommand` es el tercer comando concreto del sistema. Su contribución específica al patrón es la **reversión condicional**: captura el estado previo del plan en `execute()` y solo deshace la operación si dicho estado era `ACTIVO`. Esto permite que `POST /api/commands/undo` revierta un archivado accidental sin necesidad de que el controller o el servicio expongan lógica adicional de reversión.
