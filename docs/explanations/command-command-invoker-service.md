# Patrón Command — CommandInvokerService

El patrón **Command** encapsula una acción como un objeto independiente.

En este backend, una operación como **invitar un cliente** no se ejecuta directamente desde el controller. En lugar de eso, se crea un objeto comando, por ejemplo:

```ts
new InvitarClienteCommand(...)
```

Ese objeto sabe:

- qué debe hacer en `execute()`;
- cómo deshacerlo en `undo()`;
- cómo describirse en `descripcion()`.

## Partes implementadas

### 1. Interfaz `Command`

Archivo:

```txt
apps/api/src/commands/command.interface.ts
```

Define el contrato común para todos los comandos:

```ts
export interface Command<T = unknown> {
  execute(): Promise<T>;
  undo(): Promise<void>;
  descripcion(): string;
}
```

Cualquier comando del sistema debe implementar esos métodos.

### 2. `CommandInvokerService`

Archivo:

```txt
apps/api/src/commands/command-invoker.service.ts
```

Es el ejecutor central de comandos.

Responsabilidades:

1. Ejecutar el comando:

```ts
await command.execute();
```

2. Guardar el comando en un historial:

```ts
this.historial.push(command);
```

3. Permitir deshacer el último comando:

```ts
await command.undo();
```

Esto permite tener comportamiento tipo **undo**.

### 3. `InvitarClienteCommand`

Archivo:

```txt
apps/api/src/modules/clientes/commands/invitar-cliente.command.ts
```

Este comando encapsula la acción completa de invitar un cliente.

Su método `execute()` hace lo siguiente:

1. Genera un token UUID.
2. Crea la invitación en base de datos mediante `InvitacionesRepository`.
3. Guarda el `invitacionId` para poder revertir la acción.
4. Envía el correo usando `MailerService`.

Su método `undo()` hace lo siguiente:

```ts
marcarConsumidaPorId(this.invitacionId)
```

Es decir, revierte la invitación marcándola como consumida/inutilizable.

## Para qué sirve en este proyecto

Sin Command, el controller tendría que hacer directamente toda la operación:

```txt
crear invitación
 enviar correo
```

Con Command, el controller solo construye el comando y se lo entrega al invoker:

```ts
const command = new InvitarClienteCommand(...);
await this.commandInvoker.ejecutar(command);
```

Ventajas:

- El controller queda más limpio.
- La acción queda encapsulada en una clase reutilizable.
- Se puede guardar historial de acciones.
- Se puede deshacer la última acción ejecutada.
- Se pueden agregar nuevos comandos con la misma estructura, por ejemplo:
  - `DesactivarClienteCommand`;
  - `ArchivarPlanCommand`;
  - `ReenviarInvitacionCommand`.

Todos funcionarían igual porque comparten la interfaz `Command`.

## Flujo de invitación

Cuando se llama:

```http
POST /api/clientes/invitar
```

ocurre este flujo:

```txt
ClientesController
  └── crea InvitarClienteCommand
        └── CommandInvokerService.ejecutar(command)
              └── command.execute()
                    ├── crea invitación
                    └── envía email
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
              └── marca invitación como consumida
```

## Resumen

El patrón **Command** se usa aquí para convertir operaciones de negocio en objetos ejecutables y reversibles.

En concreto, `CommandInvokerService` permite ejecutar comandos, mantener un historial y deshacer el último comando ejecutado. `InvitarClienteCommand` es el primer comando concreto implementado y encapsula el flujo de creación de invitación y envío de correo.
