# Patrón Prototype — PlanDeEntrenamientoPrototype

El patrón **Prototype** crea nuevos objetos copiando un objeto existente. En lugar de construir el objeto desde cero, se parte de uno ya configurado y se ajustan solo las diferencias.

En este backend, cuando se duplica un plan de entrenamiento, hay que crear una copia con todos sus ejercicios pero sin identidad propia (sin `id`), en estado `BORRADOR` y con el nombre modificado. `PlanDeEntrenamientoPrototype` encapsula esa lógica de copia.

## Partes implementadas

### 1. Interfaz `Cloneable`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/prototypes/plan.prototype.ts
```

Define el contrato genérico para cualquier objeto que pueda clonarse:

```ts
export interface Cloneable<T> {
  clone(): T;
}
```

### 2. `PlanDeEntrenamientoPrototype`

Recibe el plan original en el constructor e implementa `clone()`:

```ts
export class PlanDeEntrenamientoPrototype implements Cloneable<PlanCloneSnapshot> {
  constructor(private readonly original: PlanClonable) {}

  clone(): PlanCloneSnapshot {
    return {
      entrenadorId: this.original.entrenadorId,
      nombre: `${this.original.nombre} (copia)`,
      descripcion: this.original.descripcion,
      tipo: this.original.tipo,
      estado: EstadoPlan.BORRADOR,
      ejercicioPlanes: this.original.ejercicioPlanes?.map((ep) => ({
        ejercicioId: ep.ejercicioId,
        series: ep.series,
        repeticiones: ep.repeticiones,
        segundosDeDescanso: ep.segundosDeDescanso,
        notas: ep.notas,
        orden: ep.orden,
      })),
    };
  }
}
```

El clon:
- no tiene `id` (lo asignará la base de datos al persistir);
- siempre empieza en `BORRADOR` independientemente del estado del original;
- agrega el sufijo `(copia)` al nombre;
- copia los `ejercicioPlanes` sin sus `id`.

## Para qué sirve en este proyecto

Sin Prototype, el servicio tendría que armar el objeto clon campo a campo:

```ts
// sin el patrón
await this.planesRepository.crear({
  nombre: plan.nombre + ' (copia)',
  tipo: plan.tipo,
  estado: EstadoPlan.BORRADOR,
  entrenador: { connect: { id: plan.entrenadorId } },
  // ... y también los ejercicios uno a uno
});
```

Con Prototype, el servicio solo construye el prototipo y llama a `clone()`:

```ts
const snapshot = new PlanDeEntrenamientoPrototype(plan).clone();
return this.planesRepository.crearDesdeClone(snapshot);
```

La lógica de qué se copia, qué se resetea y qué se modifica queda encapsulada en la clase.

## Flujo

Cuando se llama:

```http
POST /api/planes-entrenamiento/:id/duplicar
```

ocurre este flujo:

```txt
PlanesEntrenamientoController
  └── PlanesEntrenamientoService.duplicar()
        └── findById() → carga el plan con sus ejercicios desde BD
        └── new PlanDeEntrenamientoPrototype(plan).clone()
              └── devuelve PlanCloneSnapshot:
                    ├── nombre: "<original> (copia)"
                    ├── estado: BORRADOR
                    ├── sin id
                    └── ejercicioPlanes: copia de cada ejercicio sin id
        └── PlanesEntrenamientoRepository.crearDesdeClone(snapshot)
              └── persiste el nuevo plan en BD con sus ejercicios
```
