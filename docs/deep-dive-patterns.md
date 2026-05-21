# Profundización: Decorator, Strategy y Prototype

Este documento expandinge los patrones de diseño **Decorator**, **Strategy** y **Prototype** aplicados al proyecto Fitness SaaS.

---

## 1. Decorator

### ¿Qué es?

El patrón **Decorator** es un patrón estructural que permite agregar dinámicamente responsabilidades adicionales a un objeto sin modificar su clase original. Funciona envolviendo el objeto original en un "decorador" que intercepta las llamadas y puede modificar su comportamiento antes o después de delegar al objeto envuelto.

La clave conceptual es que ambos (el decorador y el objeto original) implementan la misma interfaz, por lo que el cliente no necesita saber si está interactuando con el objeto original o un decorador.

### ¿Por qué se usa?

1. **Extensión sin herencia**: La herencia rígida crea jerarquías inflexibles. Un objeto solo puede heredar de una clase. El decorator permite combinar múltiples responsabilidades de forma dinámica.

2. **Principio de responsabilidad única**: Cada clase tiene una sola razón para cambiar. El decorator separa la lógica de cache/logger/metrics del servicio core.

3. **Composición sobre herencia**: En lugar de construir una clase `ServicioConCacheYLogging`, se envuelve el servicio en un `CacheDecorator` y luego en un `LoggingDecorator`.

4. **Runtime flexibility**: Los decoradores pueden añadirse o removerse en tiempo de ejecución según las necesidades.

### Aplicación en Fitness SaaS

```
┌─────────────────────────────────────────────────────┐
│                   Cliente code                       │
│  (EjerciciosService.findAll())                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            CacheEjerciciosDecorator                 │
│  - findAll() → busca en Map primero                 │
│  - findById(id) → busca en Map primero              │
│  - invalidate(key) → limpia entrada específica     │
│  - flush() → limpia todo el cache                   │
└──────────────────────┬──────────────────────────────┘
                       │ (si no hay en cache)
                       ▼
┌─────────────────────────────────────────────────────┐
│              EjerciciosService (original)            │
│  - findAll() → consulta DB                          │
│  - findById(id) → consulta DB                       │
│  - create() → persiste nuevo ejercicio              │
└─────────────────────────────────────────────────────┘
```

**Escenario concreto**: Un entrenador abre la lista de ejercicios 50 veces al día. En lugar de consultar la base de datos cada vez, el `CacheEjerciciosDecorator` almacena los resultados en un `Map<string, Ejercicio[]>`. La segunda llamada retorna inmediatamente desde memoria.

### Ventajas para Fitness SaaS

| Ventaja | Impacto |
|---------|---------|
| **Rendimiento** | Llamadas repetitivas a `findAll()` son ~100x más rápidas desde cache |
| **Desacoplamiento** | `EjerciciosService` no sabe que existe cache; es testeable aisladamente |
| **Extensibilidad** | Agregar `LoggingDecorator` o `MetricsDecorator` sin tocar código existente |
| **Invalidación selectiva** | Cuando se crea/actualiza un ejercicio, solo esa key se invalida |

### Implementación sugerida en NestJS

```typescript
// decorators/cache-ejercicios.decorator.ts
export function CacheEjercicios<T>(cache: Map<string, T>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const original = descriptor.value;
    
    descriptor.value = function (...args) {
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = original.apply(this, args);
      cache.set(key, result);
      return result;
    };
    
    return descriptor;
  };
}
```

---

## 2. Strategy

### ¿Qué es?

El patrón **Strategy** es un patrón comportamental que define una familia de algoritmos, encapsula cada uno, y los hace intercambiables. El contexto que usa el algoritmo selecciona cuál estrategia utilizar sin que el cliente sepa cómo opera internamente.

La diferencia con Decorator es sutil pero importante: **Decorator** agrega funcionalidad al mismo objeto (cache, logging), mientras que **Strategy** reemplaza el algoritmo completo para un mismo propósito.

### ¿Por qué se usa?

1. **Eliminar condicionales complejas**: En lugar de `if (tipo === 'semanal') { calcularSemanal() } else if (tipo === 'mensual') { calcularMensual() }`, se delega a la estrategia correspondiente.

2. **Apertura para extensión**: Agregar una nueva estrategia (ej. `ProgresoTrimestralStrategy`) no requiere modificar el código existente.

3. **Testabilidad aislada**: Cada estrategia es una clase independiente, fácil de probar unitariamente.

4. **Selección dinámica**: El usuario puede cambiar de estrategia en runtime sin recompilar.

### Aplicación en Fitness SaaS

```
┌─────────────────────────────────────────────────────┐
│              ProgresoCalculator                       │
│  calculate(clienteId, estrategia)                    │
└──────────────────────┬──────────────────────────────┘
                       │ estrategia.calculate(clienteId)
           ┌───────────┴───────────┬─────────────────┐
           ▼                       ▼                   ▼
┌──────────────────┐  ┌───────────────────┐  ┌─────────────────┐
│ ProgresoSemanal  │  │ ProgresoMensual   │  │ ProgresoPorPlan │
│ - resume por     │  │ - resume por mes  │  │ - resume por    │
│   semana        │  │                   │  │   plan completado│
└──────────────────┘  └───────────────────┘  └─────────────────┘
```

**Escenario concreto**: El entrenador quiere ver el progreso de un cliente. Puede elegir:
- Vista **semanal**: cada semana muestra kg perdidos, ejercicios completados
- Vista **mensual**: resumen de 4 semanas, tendencias
- Vista **por plan**: progreso dentro de cada plan específico

El `ProgresoCalculator` recibe la estrategia y la ejecuta. No le importa cómo calcula cada una.

### Ventajas para Fitness SaaS

| Ventaja | Impacto |
|---------|---------|
| **Flexibilidad** | El cliente selecciona cómo quiere ver su progreso |
| **Mantenibilidad** | Agregar `ProgresoTrimestralStrategy` no requiere tocar `ProgresoCalculator` |
| **Testabilidad** | Cada estrategia se prueba con datos controlados |
| **Single Responsibility** | Cada estrategia sabe solo cómo calcular su tipo específico |

### Implementación sugerida

```typescript
interface ProgresoStrategy {
  calculate(clienteId: string): Promise<ProgresoResumen>;
}

@Injectable()
class ProgresoCalculator {
  constructor(
    @Inject('PROGRESO_STRATEGY') private strategy: ProgresoStrategy,
  ) {}

  async getProgreso(clienteId: string) {
    return this.strategy.calculate(clienteId);
  }
}
```

---

## 3. Prototype

### ¿Qué es?

El patrón **Prototype** es un patrón creacional que permite crear nuevos objetos copiando (clonando) instancias existentes sin acoplar a sus clases concretas. El clon es independiente del original: modificaciones al clon no afectan al objeto source y viceversa.

### ¿Por qué se usa?

1. **Evitar recostrucción costosa**: Si crear un objeto requiere consultar múltiples tablas o procesar datos complejos, clonear desde un prototipo existente es más eficiente.

2. **Eliminar duplicación**: En lugar de recreate un `PlanDeEntrenamiento` con 20 ejercicios desde cero, se clona y se ajustan solo los campos necesarios.

3. **Independencia de la clase concreta**: El código que pide una copia no necesita conocer la clase exacta del objeto; trabaja con una interfaz `Cloneable`.

4. **Variaciones de plantillas**: Crear múltiples objetos similares partiendo de un template sin modificar el template original.

### Aplicación en Fitness SaaS

```
PlanDeEntrenamiento "Plan A"
├── nombre: "Hipertrofia Semanal"
├── ejercicios: [EjercicioPlan A1, A2, A3, ... A20]
└── ...

    ┌── clone() ──► PlanDeEntrenamiento "Plan A (copia)"
                    ├── nombre: "Hipertrofia Semanal (copia)"
                    ├── ejercicios: [copia de A1, A2, A3, ... A20]
                    └── id: nuevo
```

**Escenario concreto**: El entrenador tiene un plan de hipertrofia exitoso para Cliente A. Llega Cliente B con objetivos similares. El entrenador hace click en "Duplicar plan" → el sistema clona el plan completo con todos sus ejercicios, genera un nuevo ID, y lo asigna a Cliente B. El plan original permanece intacto.

### Ventajas para Fitness SaaS

| Ventaja | Impacto |
|---------|---------|
| **Velocidad** | Crear plan para nuevo cliente en segundos, no minutos |
| **Consistencia** | Todos los ejercicios se copian correctamente (relaciones, series, repeticiones) |
| **Seguridad** | Modificaciones al plan nuevo no afectan al original |
| **Reducción de queries** | No necesita volver a consultar catálogos para recrear cada ejercicio |

### Implementación sugerida

```typescript
interface Cloneable<T> {
  clone(): T;
}

@Injectable()
class PlanService {
  async duplicatePlan(planId: string, nuevoClienteId: string): Promise<PlanDeEntrenamiento> {
    const original = await this.planRepo.findOne({
      where: { id: planId },
      relations: ['ejercicios'],
    });

    const cloned = plainToInstance(PlanDeEntrenamiento, {
      ...original,
      id: undefined,
      clienteId: nuevoClienteId,
      nombre: `${original.nombre} (copia)`,
      ejercicios: original.ejercicios.map(e => ({
        ...e,
        id: undefined,
        planId: undefined,
      })),
    });

    return this.planRepo.save(cloned);
  }
}
```

---

## Comparativa de Patrones

| Aspecto | Decorator | Strategy | Prototype |
|---------|-----------|----------|-----------|
| **Propósito** | Agregar funcionalidad | Cambiar algoritmo | Clonar objeto |
| **Categoría** | Estructural | Comportamental | Creacional |
| **Modifica** | Comportamiento en runtime | Comportamiento según contexto | Estructura del objeto |
| **Composicion** | Se apilan (cache+logging) | Una estrategia activa | Un clon por operación |
| **Estado** | Puede mantener estado | Generalmente sin estado | Copia el estado existente |

---

## Cuándo usar cada uno en Fitness SaaS

| Patrón | Cuándo aplicarlo |
|--------|------------------|
| **Decorator** | Cuando necesitas agregar cache, logging, metrics a un servicio sin modificarlo |
| **Strategy** | Cuando existe más de una forma válida de calcular/presentar algo y el usuario debe elegir |
| **Prototype** | Cuando crear un objeto desde cero es costoso y existen plantillas preexistentes para clonar |
