# Patrón Factory Method — PlanFactory

El patrón **Factory Method** delega la creación de un objeto a una subclase, de modo que el código que pide el objeto no necesita saber qué tipo concreto se va a instanciar.

En este backend, cuando se crea un plan de entrenamiento, el tipo de plan (`HIPERTROFIA`, `FUERZA`, `RESISTENCIA`) determina los valores por defecto de los ejercicios. En lugar de un `if` o `switch` en el servicio, cada tipo tiene su propia clase fábrica que sabe qué valores producir.

## Partes implementadas

### 1. Clase abstracta `PlanFactory`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/factories/plan.factory.ts
```

Define el contrato que deben cumplir todas las fábricas concretas:

```ts
export abstract class PlanFactory {
  abstract crear(dto: CrearPlanFactoryDto): PlanDraft;
}
```

`PlanDraft` incluye los datos del plan y un objeto `ejercicioDefaults` con `series`, `repeticiones` y `segundosDeDescanso`.

### 2. Fábricas concretas

Cada una extiende `PlanFactory` e implementa `crear()` con sus propios defaults:

| Archivo | Tipo | series | repeticiones | descanso |
|---|---|---|---|---|
| `hipertrofia.factory.ts` | HIPERTROFIA | 4 | 10 | 60s |
| `fuerza.factory.ts` | FUERZA | 5 | 5 | 180s |
| `resistencia.factory.ts` | RESISTENCIA | 3 | 15 | 30s |

Ejemplo de `HipertrofiaFactory`:

```ts
export class HipertrofiaFactory extends PlanFactory {
  crear(dto: CrearPlanFactoryDto): PlanDraft {
    return {
      nombre: dto.nombre,
      tipo: TipoPlanEntrenamiento.HIPERTROFIA,
      ejercicioDefaults: { series: 4, repeticiones: 10, segundosDeDescanso: 60 },
    };
  }
}
```

### 3. `PlanFactoriesProvider`

Archivo:

```txt
apps/api/src/modules/planes-entrenamiento/factories/plan-factory.provider.ts
```

Es un provider NestJS que mantiene las tres fábricas en un mapa y las entrega por tipo:

```ts
obtener(tipo: TipoPlanEntrenamiento): PlanFactory {
  return this.factories[tipo];
}
```

## Para qué sirve en este proyecto

Sin Factory Method, el servicio tendría que decidir qué defaults aplicar:

```ts
// sin el patrón
if (tipo === 'HIPERTROFIA') { series = 4; repeticiones = 10; ... }
else if (tipo === 'FUERZA') { series = 5; ... }
```

Con Factory Method, el servicio solo pide la fábrica correcta y recibe un `PlanDraft`:

```ts
const draft = this.planFactoriesProvider.obtener(tipo).crear({ ...dto, tipo });
await this.planesRepository.crear({ ...draft, estado: EstadoPlan.BORRADOR, ... });
```

El servicio no sabe qué fábrica se ejecutó ni qué defaults se eligieron. Agregar un nuevo tipo de plan solo requiere crear una nueva clase que extienda `PlanFactory`.

## Flujo

Cuando se llama:

```http
POST /api/planes-entrenamiento
{ "nombre": "Mi plan", "tipo": "HIPERTROFIA" }
```

ocurre este flujo:

```txt
PlanesEntrenamientoController
  └── PlanesEntrenamientoService.crearParaUsuario()
        └── PlanFactoriesProvider.obtener('HIPERTROFIA')
              └── HipertrofiaFactory.crear(dto)
                    └── devuelve PlanDraft con series=4, reps=10, descanso=60s
        └── PlanesEntrenamientoRepository.crear()
              └── persiste plan en BD con estado BORRADOR
```
