# Patrón Strategy — ProgresoService

El patrón **Strategy** define una familia de algoritmos, los encapsula en clases separadas y los hace intercambiables sin que el código que los usa tenga que cambiar.

En este backend, calcular el progreso de un cliente no siempre significa lo mismo. Puede significar agrupar sus sesiones por semana, por mes, o por el plan de entrenamiento que tenía vigente en cada fecha. En lugar de un gran bloque `if/else` dentro del servicio, cada forma de calcular es una clase independiente. El servicio simplemente delega al algoritmo que esté activo en ese momento.

## Partes implementadas

### 1. Interfaz `ProgresoStrategy`

Archivo:

```txt
apps/api/src/modules/progreso/strategies/progreso-strategy.interface.ts
```

Define el contrato que deben cumplir todos los algoritmos de cálculo:

```ts
export interface ProgresoStrategy {
  calcular(
    registros: RegistroConEjercicios[],
    contexto?: ProgresoStrategyContexto,
  ): ProgresoResumen;
}
```

También define los tipos de salida:

```ts
export interface PeriodoResumen {
  etiqueta: string;        // "2026-W22", "2026-05", "Plan Hipertrofia"
  totalSesiones: number;
  totalEjercicios: number;
  duracionTotalMin: number;
}

export interface ProgresoResumen {
  totalSesiones: number;
  periodos: PeriodoResumen[];
}
```

Todas las estrategias retornan el mismo shape. El controller y la facade nunca saben cuál algoritmo está ejecutando.

### 2. `ProgresoSemanalStrategy`

Archivo:

```txt
apps/api/src/modules/progreso/strategies/progreso-semanal.strategy.ts
```

Agrupa los registros por semana ISO (`YYYY-Www`). Usa getters UTC para evitar que las zonas horarias del servidor alteren las fechas:

```ts
function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // ...calcula número de semana ISO...
  return `${año}-W${semana}`;
}
```

Ejemplo de salida para dos sesiones en la misma semana:

```txt
periodos: [{ etiqueta: "2026-W22", totalSesiones: 2, ... }]
```

### 3. `ProgresoMensualStrategy`

Archivo:

```txt
apps/api/src/modules/progreso/strategies/progreso-mensual.strategy.ts
```

Agrupa los registros por mes en formato `YYYY-MM`. Misma estructura que la estrategia semanal, distinto criterio de agrupación:

```ts
function mesLabel(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
```

### 4. `ProgresoPorPlanStrategy`

Archivo:

```txt
apps/api/src/modules/progreso/strategies/progreso-por-plan.strategy.ts
```

Es la estrategia más compleja. Agrupa los registros según qué plan de entrenamiento tenía asignado el cliente en la fecha de cada sesión. Requiere un `contexto` con las asignaciones del cliente:

```ts
calcular(
  registros: RegistroConEjercicios[],
  contexto?: ProgresoStrategyContexto,
): ProgresoResumen
```

Para cada registro busca la asignación vigente más reciente en esa fecha:

```ts
function asignacionVigenteEn(asignaciones, fecha) {
  // ordena por fecha de asignación y retorna la última que sea <= fecha del registro
}
```

Si no hay ninguna asignación vigente, el registro cae en la etiqueta `"Sin plan asignado"`.

### 5. `ProgresoService`

Archivo:

```txt
apps/api/src/modules/progreso/services/progreso.service.ts
```

Es el **contexto** del patrón Strategy. Mantiene una referencia a la estrategia activa y delega el cálculo a ella:

```ts
export class ProgresoService {
  private estrategia: ProgresoStrategy;

  constructor(...) {
    this.estrategia = semanalStrategy; // estrategia por defecto
  }

  setEstrategia(estrategia: ProgresoStrategy): void {
    this.estrategia = estrategia;
  }

  async calcularProgreso(clienteId: string, vista: VistaProgreso): Promise<ProgresoResumen> {
    const registros = await this.registrosRepository.findPorClienteConDetalle(clienteId);

    if (vista === 'mensual') {
      this.setEstrategia(this.mensualStrategy);
      return this.estrategia.calcular(registros);
    }

    if (vista === 'porPlan') {
      this.setEstrategia(this.porPlanStrategy);
      const asignaciones = await this.asignacionesRepository.findPorCliente(clienteId);
      const contexto = { asignaciones: asignaciones.map(...) };
      return this.estrategia.calcular(registros, contexto);
    }

    return this.estrategia.calcular(registros); // semanal por defecto
  }
}
```

Importante: cuando `vista` es `'semanal'` el servicio no sobreescribe `this.estrategia`. Esto permite inyectar una estrategia personalizada externamente mediante `setEstrategia()` sin que el servicio la pise.

### 6. `ProgresoController`

Archivo:

```txt
apps/api/src/modules/progreso/controllers/progreso.controller.ts
```

Recibe el query param `vista` y lo pasa al servicio. La validación del DTO garantiza que solo acepte los valores permitidos:

```ts
// progreso-query.dto.ts
@IsOptional()
@IsIn(['semanal', 'mensual', 'porPlan'])
vista?: VistaProgreso;
```

Si no se envía `vista`, el servicio usa `'semanal'` por defecto.

## Para qué sirve en este proyecto

Sin Strategy, el servicio tendría una sola función con condicionales anidados:

```ts
async calcularProgreso(clienteId, vista) {
  if (vista === 'semanal') {
    // 20 líneas de lógica de semanas
  } else if (vista === 'mensual') {
    // 20 líneas de lógica de meses
  } else if (vista === 'porPlan') {
    // 30 líneas de lógica de asignaciones
  }
}
```

Con Strategy, el servicio no sabe nada de cómo se calcula. Solo sabe que tiene una estrategia y que puede pedirle el resultado:

```ts
return this.estrategia.calcular(registros, contexto);
```

Ventajas:

- Agregar una nueva vista (por ejemplo, `'anual'`) significa crear una nueva clase; no modificar `ProgresoService`.
- Cada estrategia se puede probar de forma completamente independiente con un dataset fijo en memoria.
- El controller y la facade son ajenos al algoritmo; solo pasan el parámetro `vista`.
- `setEstrategia()` permite inyectar estrategias externas en tests o en integraciones futuras.

## Flujo de cálculo de progreso

Cuando se llama:

```http
GET /api/clientes/abc123/progreso?vista=mensual
```

ocurre este flujo:

```txt
ProgresoController
  └── recibe vista="mensual"
        └── ProgresoService.calcularProgreso(clienteId, "mensual")
              ├── registrosRepository.findPorClienteConDetalle(clienteId)
              ├── setEstrategia(ProgresoMensualStrategy)
              └── this.estrategia.calcular(registros)
                    └── agrupa por YYYY-MM
                    └── retorna ProgresoResumen
```

Cuando se llama:

```http
GET /api/clientes/abc123/progreso?vista=porPlan
```

ocurre este flujo:

```txt
ProgresoController
  └── recibe vista="porPlan"
        └── ProgresoService.calcularProgreso(clienteId, "porPlan")
              ├── registrosRepository.findPorClienteConDetalle(clienteId)
              ├── asignacionesRepository.findPorCliente(clienteId)
              ├── setEstrategia(ProgresoPorPlanStrategy)
              └── this.estrategia.calcular(registros, { asignaciones })
                    └── por cada registro, busca asignación vigente en esa fecha
                    └── retorna ProgresoResumen
```

## Resumen

El patrón **Strategy** se usa aquí para intercambiar el algoritmo de agrupación del progreso sin modificar el servicio ni el controller. `ProgresoService` actúa como contexto: mantiene la estrategia activa y delega el cálculo. `ProgresoSemanalStrategy`, `ProgresoMensualStrategy` y `ProgresoPorPlanStrategy` son las tres estrategias concretas, cada una con su propia lógica de agrupación, probables de forma independiente y completamente transparentes para el resto del sistema.
