# Patrón Builder — RegistroEntrenamientoBuilder

El patrón **Builder** separa la construcción de un objeto complejo de su representación final.

En este backend, registrar un entrenamiento implica combinar datos opcionales (duración, notas) con una lista variable de ejercicios. Si esa lógica viviera directamente en el servicio, el código mezclaría validaciones, armado de datos y persistencia en un solo bloque. El Builder extrae todo el armado a una clase dedicada, de forma que el servicio solo llama setters y `build()`.

## Partes implementadas

### 1. Tipos de dominio

Archivo:

```txt
apps/api/src/modules/registros/builders/registro-entrenamiento.builder.ts
```

Antes de la clase, se definen dos interfaces que representan la forma final del objeto que el builder produce:

```ts
export interface RegistroDeEjercicioDraft {
  ejercicioId?: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  series: number;
  repeticiones: number;
  pesoKg?: number;
  notas?: string;
}

export interface RegistroEntrenamientoDraft {
  fecha: Date;
  clienteId: string;
  ejercicios: RegistroDeEjercicioDraft[];
  notas?: string;
  duracionMin?: number;
}
```

`RegistroEntrenamientoDraft` es el producto final. El repositorio lo recibe y lo persiste.

### 2. `RegistroEntrenamientoBuilder`

Mismo archivo.

La clase mantiene estado interno con todos los campos del producto como propiedades privadas:

```ts
export class RegistroEntrenamientoBuilder {
  private fecha?: Date;
  private clienteId?: string;
  private readonly ejercicios: RegistroDeEjercicioDraft[] = [];
  private notas?: string;
  private duracionMin?: number;
  ...
}
```

Cada setter aplica el dato correspondiente y retorna `this`, permitiendo encadenamiento:

```ts
setFecha(fecha: Date): this { ... return this; }
setClienteId(clienteId: string): this { ... return this; }
addEjercicio(ejercicio: RegistroDeEjercicioDraft): this { ... return this; }
setNotas(notas: string): this { ... return this; }
setDuracionMin(duracionMin: number): this { ... return this; }
```

El método `build()` centraliza todas las validaciones y produce una copia inmutable:

```ts
build(): Readonly<RegistroEntrenamientoDraft> {
  if (!this.fecha) throw new BadRequestException('...');
  if (!this.clienteId) throw new BadRequestException('...');
  if (this.ejercicios.length < 1) throw new BadRequestException('...');

  return Object.freeze({
    fecha: new Date(this.fecha),
    clienteId: this.clienteId,
    ejercicios: this.ejercicios.map((e) => ({ ...e })),
    notas: this.notas,
    duracionMin: this.duracionMin,
  });
}
```

`Object.freeze` garantiza que el payload entregado al repositorio no pueda ser mutado accidentalmente por ninguna capa superior.

### 3. `RegistrosService` — el director

Archivo:

```txt
apps/api/src/modules/registros/services/registros.service.ts
```

El servicio actúa como **director**: conoce el orden de los pasos y delega cada uno al builder. Primero valida que el cliente pertenece al workspace, luego construye el registro:

```ts
const builder = new RegistroEntrenamientoBuilder()
  .setFecha(new Date(dto.fecha))
  .setClienteId(clienteId);

if (dto.duracionMin !== undefined) builder.setDuracionMin(dto.duracionMin);
if (dto.notas !== undefined) builder.setNotas(dto.notas);

for (const ejercicio of dto.ejercicios) {
  builder.addEjercicio(ejercicio);
}

const payload = builder.build();
return this.registrosRepository.crearConEjercicios(payload);
```

El servicio no necesita saber cómo se valida ni cómo se congela el objeto; simplemente pasa datos al builder y confía en que `build()` producirá un resultado válido o lanzará una excepción descriptiva.

### 4. `RegistrosEntrenamientoRepository` — el consumidor

Archivo:

```txt
apps/api/src/modules/registros/repositories/registros-entrenamiento.repository.ts
```

Recibe el `RegistroEntrenamientoDraft` inmutable y lo persiste en una sola operación Prisma, creando `RegistroDeEntrenamiento` y todos sus `RegistroDeEjercicio` anidados:

```ts
crearConEjercicios(payload: Readonly<RegistroEntrenamientoDraft>) {
  return client.registroDeEntrenamiento.create({
    data: {
      clienteId: payload.clienteId,
      fecha: payload.fecha,
      notas: payload.notas,
      duracionMin: payload.duracionMin,
      ejercicios: {
        create: payload.ejercicios.map((e) => ({ ... })),
      },
    },
    include: { ejercicios: true },
  });
}
```

El repositorio no sabe nada sobre el builder; solo consume el contrato `RegistroEntrenamientoDraft`.

## Para qué sirve en este proyecto

Sin Builder, el servicio tendría que construir el objeto de registro directamente:

```ts
// sin el patrón
const data = {
  clienteId,
  fecha: new Date(dto.fecha),
  notas: dto.notas,
  duracionMin: dto.duracionMin,
  ejercicios: dto.ejercicios,
};
// ¿validamos que haya ejercicios? ¿dónde? ¿y si duracionMin no viene?
await this.registrosRepository.crearConEjercicios(data);
```

Con Builder, las validaciones y el armado del objeto son responsabilidad exclusiva de `RegistroEntrenamientoBuilder.build()`. El servicio queda libre de esa lógica y el repositorio recibe siempre un payload garantizadamente válido.

Cuando se necesite agregar un nuevo campo opcional al registro (por ejemplo, `frecuenciaCardiacaPromedio`), solo hay que añadir un setter al builder. El servicio y el repositorio no necesitan cambiar su estructura.

## Flujo de registro

Cuando se llama:

```http
POST /api/clientes/:id/registros-entrenamiento
{
  "fecha": "2026-05-25",
  "duracionMin": 60,
  "notas": "sesión intensa",
  "ejercicios": [
    { "nombre": "Press banca", "grupoMuscular": "PECHO", "series": 4, "repeticiones": 10, "pesoKg": 80 }
  ]
}
```

ocurre este flujo:

```txt
RegistrosController
  └── RegistrosService.registrar(clienteId, workspaceId, dto)
        ├── ClientesRepository.findByIdConPerfil()  ← valida workspace
        └── RegistroEntrenamientoBuilder
              ├── .setFecha(...)
              ├── .setClienteId(...)
              ├── .setDuracionMin(...)
              ├── .setNotas(...)
              ├── .addEjercicio(...)  ← una vez por cada ejercicio del DTO
              └── .build()           ← valida y produce Readonly<RegistroEntrenamientoDraft>
        └── RegistrosEntrenamientoRepository.crearConEjercicios(payload)
              └── persiste RegistroDeEntrenamiento + RegistroDeEjercicio[] en BD
```

## Resumen

El patrón **Builder** se usa aquí para encapsular la construcción de un `RegistroEntrenamientoDraft` complejo, con campos opcionales y una lista variable de ejercicios. `RegistroEntrenamientoBuilder` concentra toda la lógica de armado y validación en un solo lugar. El servicio actúa como director: conoce el orden de los pasos pero delega cada uno al builder. El repositorio consume el producto final sin saber cómo fue construido.
