# Patrón Decorator — CacheEjerciciosDecorator

El patrón **Decorator** permite agregar comportamiento a un objeto sin modificar su clase original.

En este backend, el servicio real de ejercicios no implementa cache directamente. En lugar de eso, se crea un decorador:

```ts
new CacheEjerciciosDecorator(ejerciciosServiceImpl)
```

Ese decorador envuelve al servicio base y agrega cache para consultas como:

- listar todos los ejercicios;
- buscar un ejercicio por id;
- buscar ejercicios por grupo muscular.

## Partes implementadas

### 1. Interfaz `EjerciciosServiceInterface`

Archivo:

```txt
apps/api/src/modules/ejercicios/interfaces/ejercicios-service.interface.ts
```

Define el contrato común que deben cumplir tanto el servicio real como los decoradores:

```ts
export interface EjerciciosServiceInterface {
  findAll(): Promise<Ejercicio[]>;
  findById(id: string): Promise<Ejercicio | null>;
  findByGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]>;
  create(dto: CrearEjercicioDto): Promise<Ejercicio>;
}
```

Gracias a esta interfaz, el controller puede usar cualquier implementación compatible sin saber si está hablando con el servicio base o con un decorador.

### 2. `EjerciciosServiceImpl`

Archivo:

```txt
apps/api/src/modules/ejercicios/services/ejercicios.service.ts
```

Es el servicio base.

Responsabilidades:

1. Recibir las operaciones de negocio de ejercicios.
2. Delegar la persistencia en `EjerciciosRepository`.
3. No conocer nada sobre cache.

Por ejemplo:

```ts
findAll(): Promise<Ejercicio[]> {
  return this.ejerciciosRepository.findAll();
}
```

Esto mantiene separada la lógica principal de ejercicios del comportamiento adicional de cache.

### 3. `BaseDecorator`

Archivo:

```txt
apps/api/src/modules/ejercicios/decorators/base.decorator.ts
```

Es la clase base para decoradores de ejercicios.

Recibe otro `EjerciciosServiceInterface` en el constructor:

```ts
constructor(protected readonly service: EjerciciosServiceInterface) {}
```

Y por defecto delega todos los métodos al servicio envuelto:

```ts
findAll(): Promise<Ejercicio[]> {
  return this.service.findAll();
}
```

Esto permite crear decoradores que solo sobrescriben los métodos donde quieren agregar comportamiento.

### 4. `CacheEjerciciosDecorator`

Archivo:

```txt
apps/api/src/modules/ejercicios/decorators/cache-ejercicios.decorator.ts
```

Es el decorador concreto.

Mantiene un cache en memoria:

```ts
private readonly cache = new Map<string, Ejercicio | Ejercicio[]>();
```

Cachea las consultas con claves específicas:

```txt
all
id:<id>
grupo:<grupoMuscular>
```

Por ejemplo, en `findAll()`:

```ts
const cached = this.cache.get('all');
if (cached !== undefined) {
  return cached;
}

const result = await super.findAll();
this.cache.set('all', result);
return result;
```

La primera llamada consulta al servicio real. La segunda llamada devuelve el resultado guardado en memoria.

También implementa métodos para invalidar cache:

```ts
invalidate(key: string): void {
  this.cache.delete(key);
}

flush(): void {
  this.cache.clear();
}
```

Cuando se crea un ejercicio nuevo, el decorador limpia todo el cache:

```ts
async create(dto: CrearEjercicioDto): Promise<Ejercicio> {
  const result = await super.create(dto);
  this.flush();
  return result;
}
```

Esto evita devolver listas viejas después de insertar datos nuevos.

### 5. Provider compuesto en `EjerciciosModule`

Archivo:

```txt
apps/api/src/modules/ejercicios/ejercicios.module.ts
```

El módulo registra el servicio real y expone el decorador mediante el token de DI:

```ts
{
  provide: 'EJERCICIOS_SERVICE',
  useFactory: (impl: EjerciciosServiceImpl) => new CacheEjerciciosDecorator(impl),
  inject: [EjerciciosServiceImpl],
}
```

Es decir, Nest crea primero:

```ts
EjerciciosServiceImpl
```

Luego lo envuelve en:

```ts
CacheEjerciciosDecorator
```

Y finalmente expone el resultado bajo el token:

```txt
EJERCICIOS_SERVICE
```

### 6. `EjerciciosController`

Archivo:

```txt
apps/api/src/modules/ejercicios/controllers/ejercicios.controller.ts
```

El controller inyecta el token, no la implementación concreta:

```ts
@Inject('EJERCICIOS_SERVICE')
private readonly ejerciciosService: EjerciciosServiceInterface
```

Por eso el controller no sabe si está usando:

```txt
EjerciciosServiceImpl
```

O:

```txt
CacheEjerciciosDecorator(EjerciciosServiceImpl)
```

Esa transparencia es la idea principal del patrón Decorator.

## Para qué sirve en este proyecto

Sin Decorator, el cache tendría que estar mezclado dentro de `EjerciciosServiceImpl`:

```txt
validar cache
consultar repositorio
actualizar cache
invalidar cache
```

Con Decorator, el servicio base queda simple y el cache queda encapsulado en otra clase:

```ts
const service = new CacheEjerciciosDecorator(new EjerciciosServiceImpl(...));
```

Ventajas:

- El servicio real no se contamina con lógica de cache.
- El controller no cambia.
- El decorador puede quitarse o reemplazarse sin modificar el controller.
- Se pueden agregar nuevos decoradores con la misma interfaz, por ejemplo:
  - `LoggingEjerciciosDecorator`;
  - `MetricasEjerciciosDecorator`;
  - `AuditoriaEjerciciosDecorator`.

Todos funcionarían igual porque respetan `EjerciciosServiceInterface`.

## Flujo de consulta con cache

Cuando se llama por primera vez:

```http
GET /api/ejercicios
```

ocurre este flujo:

```txt
EjerciciosController
  └── CacheEjerciciosDecorator.findAll()
        └── no encuentra key 'all' en cache
        └── BaseDecorator.findAll()
              └── EjerciciosServiceImpl.findAll()
                    └── EjerciciosRepository.findAll()
        └── guarda resultado en cache con key 'all'
        └── devuelve ejercicios
```

Cuando se llama otra vez:

```http
GET /api/ejercicios
```

ocurre este flujo:

```txt
EjerciciosController
  └── CacheEjerciciosDecorator.findAll()
        └── encuentra key 'all' en cache
        └── devuelve ejercicios sin consultar el repositorio
```

## Flujo de invalidación

Cuando se llama:

```http
POST /api/ejercicios
```

ocurre este flujo:

```txt
EjerciciosController
  └── CacheEjerciciosDecorator.create(dto)
        └── BaseDecorator.create(dto)
              └── EjerciciosServiceImpl.create(dto)
                    └── EjerciciosRepository.crear(...)
        └── flush()
              └── limpia todo el cache
        └── devuelve el ejercicio creado
```

Así, después de crear un ejercicio, la siguiente consulta vuelve a leer datos actualizados desde el repositorio.

## Resumen

El patrón **Decorator** se usa aquí para agregar cache al servicio de ejercicios sin modificar la implementación base.

En concreto, `CacheEjerciciosDecorator` envuelve a `EjerciciosServiceImpl`, intercepta las consultas para guardar y reutilizar resultados, e invalida el cache cuando se crea un ejercicio nuevo. El controller solo conoce la interfaz `EjerciciosServiceInterface`, por lo que el decorador es transparente para la capa HTTP.
