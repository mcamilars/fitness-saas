# Patrón State — PlanState

El patrón **State** permite que un objeto cambie su comportamiento cuando cambia su estado interno. En lugar de acumular condiciones en el servicio, cada estado es una clase que sabe qué puede y qué no puede hacer.

En este backend, un plan de entrenamiento puede estar en tres estados: `BORRADOR`, `ACTIVO` y `ARCHIVADO`. Las transiciones entre ellos no son simétricas, y cada estado tiene reglas distintas sobre qué operaciones son válidas.

## Partes implementadas

### 1. Interfaz `PlanState`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/states/plan-state.interface.ts
```

```ts
export interface PlanState {
  activar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState>;
  archivar(plan: PlanDeEntrenamiento, ctx: PlanStateContext): Promise<PlanState>;
  getEstado(): EstadoPlan;
}
```

`PlanStateContext` contiene `repository` y `subject` (para notificaciones). Los estados no importan `PrismaService`; todo lo que necesitan llega por el contexto.

### 2. Estados concretos

**`BorradorState`** — puede activar si tiene ejercicios, no puede archivar:

```ts
async activar(plan, ctx): Promise<PlanState> {
  const cantidad = await ctx.repository.contarEjercicios(plan.id);
  if (cantidad < 1) throw new BadRequestException('No se puede activar un plan sin ejercicios');
  await ctx.repository.updateEstado(plan.id, EstadoPlan.ACTIVO);
  await ctx.subject?.notify?.(plan.id, { tipo: 'PLAN_ACTIVADO', planId: plan.id });
  return new ActivoState();
}

archivar(): Promise<PlanState> {
  return Promise.reject(new BadRequestException('No se puede archivar un plan en borrador'));
}
```

**`ActivoState`** — puede archivar, no puede activar:

```ts
async archivar(plan, ctx): Promise<PlanState> {
  await ctx.repository.updateEstado(plan.id, EstadoPlan.ARCHIVADO);
  await ctx.subject?.notify?.(plan.id, { tipo: 'PLAN_ARCHIVADO', planId: plan.id });
  return new ArchivadoState();
}

activar(): Promise<PlanState> {
  return Promise.reject(new BadRequestException('El plan ya está activo'));
}
```

**`ArchivadoState`** — ninguna transición está permitida:

```ts
activar(): Promise<PlanState> {
  return Promise.reject(new BadRequestException('No se puede activar un plan archivado'));
}

archivar(): Promise<PlanState> {
  return Promise.reject(new BadRequestException('El plan ya está archivado'));
}
```

### 3. `PlanStateFactory`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/states/state.factory.ts
```

Reconstruye el estado correcto a partir del valor persistido en base de datos:

```ts
fromEstado(estado: EstadoPlan): PlanState {
  const states = {
    [EstadoPlan.BORRADOR]: new BorradorState(),
    [EstadoPlan.ACTIVO]: new ActivoState(),
    [EstadoPlan.ARCHIVADO]: new ArchivadoState(),
  };
  return states[estado];
}
```

## Para qué sirve en este proyecto

Sin State, el servicio acumularía toda la lógica de transiciones:

```ts
// sin el patrón
if (plan.estado === 'BORRADOR' && accion === 'activar') { ... }
else if (plan.estado === 'ACTIVO' && accion === 'activar') { throw ... }
else if (plan.estado === 'ARCHIVADO') { throw ... }
```

Con State, el servicio delega en el objeto de estado:

```ts
const state = this.planStateFactory.fromEstado(plan.estado);
await state.activar(plan, { repository: this.planesRepository, subject: this.planSubject });
```

Cada estado contiene sus propias reglas. Agregar un nuevo estado (por ejemplo `PAUSADO`) solo requiere crear una nueva clase.

## Tabla de transiciones

| Estado actual | `activar()` | `archivar()` |
|---|---|---|
| BORRADOR | ✅ → ACTIVO (requiere ≥1 ejercicio) | ❌ BadRequest |
| ACTIVO | ❌ BadRequest | ✅ → ARCHIVADO |
| ARCHIVADO | ❌ BadRequest | ❌ BadRequest |

## Flujo

Cuando se llama:

```http
PATCH /api/planes-entrenamiento/:id/activar
```

ocurre este flujo:

```txt
PlanesEntrenamientoController
  └── PlanesEntrenamientoService.activar()
        └── findById() → carga el plan desde BD
        └── PlanStateFactory.fromEstado(plan.estado) → BorradorState
        └── BorradorState.activar(plan, ctx)
              ├── ctx.repository.contarEjercicios() → verifica >= 1
              ├── ctx.repository.updateEstado('ACTIVO')
              └── ctx.subject.notify('PLAN_ACTIVADO')
        └── findById() → devuelve el plan actualizado
```

Si el plan ya estuviera en `ACTIVO` o `ARCHIVADO`, el state correspondiente lanzaría `BadRequestException` sin llegar al repositorio.
