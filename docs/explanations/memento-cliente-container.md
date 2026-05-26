# Patrón Memento — ClienteContainer

El patrón **Memento** permite guardar el estado interno de un objeto para poder restaurarlo después, sin exponer los detalles de ese estado al resto del sistema.

En este backend, se usa para que la desactivación de un cliente sea reversible. Antes de marcar un cliente como inactivo, se guarda una fotografía de su estado:

```ts
this.clienteContainer.guardar(id, snapshot);
```

Luego, si se necesita restaurar, se recupera el último estado guardado:

```ts
this.clienteContainer.restaurarUltimo(id);
```

## Partes implementadas

### 1. `ClienteSnapshot`

Archivo:

```txt
apps/api/src/modules/clientes/memento/cliente.memento.ts
```

Define la forma serializable del estado que se quiere guardar:

```ts
export type ClienteSnapshot = Readonly<{
  id: string;
  usuarioId: string;
  entrenadorId: string;
  espacioDeTrabajoId: string;
  estaActivo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}>;
```

Este snapshot contiene los datos mínimos necesarios para representar el estado del cliente en el momento previo a una operación reversible.

### 2. `ClienteMemento`

Archivo:

```txt
apps/api/src/modules/clientes/memento/cliente.memento.ts
```

Es el objeto que guarda el estado capturado.

Responsabilidades:

1. Recibir un `ClienteSnapshot`.
2. Guardarlo como una copia congelada.
3. Guardar el momento en el que se creó.
4. Devolver copias del estado, no referencias internas.

Por ejemplo:

```ts
constructor(estado: ClienteSnapshot, timestamp = new Date()) {
  this.estado = clonarSnapshot(estado);
  this.timestamp = new Date(timestamp);
}
```

Y para recuperar el estado:

```ts
getEstado(): ClienteSnapshot {
  return clonarSnapshot(this.estado);
}
```

Esto evita que otra parte del sistema modifique accidentalmente el estado guardado dentro del memento.

### 3. `ClienteContainer`

Archivo:

```txt
apps/api/src/modules/clientes/memento/cliente-container.ts
```

Actúa como el cuidador de los mementos.

Mantiene un historial en memoria por cliente:

```ts
private readonly mementos = new Map<string, ClienteMemento[]>();
```

Cuando se guarda un estado:

```ts
guardar(clienteId: string, snapshot: ClienteSnapshot): ClienteMemento
```

se crea un `ClienteMemento` y se agrega al historial del cliente.

Cuando se restaura:

```ts
restaurarUltimo(clienteId: string): ClienteMemento | null
```

se obtiene el último memento guardado para ese cliente. Es decir, funciona como una pila: el último estado guardado es el primero en restaurarse.

### 4. `ClientesService`

Archivo:

```txt
apps/api/src/modules/clientes/services/clientes.service.ts
```

Es quien usa el patrón Memento dentro del flujo de negocio.

Antes de desactivar un cliente, crea un snapshot:

```ts
this.clienteContainer.guardar(id, this.crearSnapshot(cliente));
```

Luego marca el cliente como inactivo mediante el repositorio:

```ts
this.clientesRepository.setActivo(id, false, workspaceId);
```

Para restaurar, recupera el último memento:

```ts
const memento = this.clienteContainer.restaurarUltimo(id);
```

Después valida que el snapshot pertenezca al mismo workspace y reactiva el cliente:

```ts
this.clientesRepository.setActivo(id, true, workspaceId);
```

### 5. `DesactivarClienteCommand`

Archivo:

```txt
apps/api/src/modules/clientes/commands/desactivar-cliente.command.ts
```

El Memento se combina con el patrón **Command** para que la desactivación pueda deshacerse desde el historial de comandos.

El comando ejecuta:

```ts
this.clientesService.softDelete(this.clienteId, this.workspaceId);
```

Y su `undo()` llama:

```ts
this.clientesService.restaurar(this.clienteDesactivadoId, this.workspaceId);
```

Así, el comando no necesita conocer cómo se guarda el estado anterior. Solo delega al servicio, y el servicio usa `ClienteContainer`.

## Para qué sirve en este proyecto

Sin Memento, al desactivar un cliente solo se haría esto:

```txt
cliente.estaActivo = false
```

El problema es que no habría un estado previo guardado para restaurar de forma controlada.

Con Memento, el flujo queda así:

```txt
guardar snapshot del cliente
marcar cliente como inactivo
```

Ventajas:

- La desactivación se vuelve reversible.
- El estado anterior queda encapsulado en `ClienteMemento`.
- El historial de estados queda separado en `ClienteContainer`.
- El servicio no expone detalles internos del snapshot al controller.
- Se integra naturalmente con `CommandInvokerService` para soportar `undo`.

## Flujo de desactivación

Cuando se llama:

```http
DELETE /api/clientes/:id
```

ocurre este flujo:

```txt
ClientesController
  └── crea DesactivarClienteCommand
        └── CommandInvokerService.ejecutar(command)
              └── command.execute()
                    └── ClientesService.softDelete(id, workspaceId)
                          ├── busca el cliente
                          ├── crea ClienteSnapshot
                          ├── ClienteContainer.guardar(id, snapshot)
                          └── ClientesRepository.setActivo(id, false)
              └── guarda command en historial
```

El cliente queda desactivado, pero su estado previo queda guardado en memoria como un memento.

## Flujo de restauración directa

Cuando se llama:

```http
POST /api/clientes/:id/restaurar
```

ocurre este flujo:

```txt
ClientesController
  └── ClientesService.restaurar(id, workspaceId)
        ├── busca el cliente
        ├── ClienteContainer.restaurarUltimo(id)
        ├── obtiene el ClienteSnapshot guardado
        ├── valida que pertenece al mismo workspace
        └── ClientesRepository.setActivo(id, true)
```

## Flujo de undo

Cuando se llama:

```http
POST /api/commands/undo
```

si el último comando fue `DesactivarClienteCommand`, ocurre este flujo:

```txt
CommandsController
  └── CommandInvokerService.deshacerUltimo()
        └── toma DesactivarClienteCommand del historial
        └── command.undo()
              └── ClientesService.restaurar(clienteId, workspaceId)
                    ├── recupera el último memento
                    └── reactiva el cliente
```

## Resumen

El patrón **Memento** se usa aquí para guardar snapshots del estado de un cliente antes de una operación destructiva lógica.

En concreto, `ClienteMemento` encapsula el estado guardado, `ClienteContainer` administra el historial de mementos por cliente, y `ClientesService` los usa para implementar `softDelete()` y `restaurar()`. Combinado con `DesactivarClienteCommand`, permite desactivar clientes y luego deshacer esa acción de forma controlada.
