# @repo/database

Paquete compartido de Prisma para el monorepo **fitness-saas**.

## 📦 ¿Qué contiene?

- **PrismaService**: Servicio NestJS con lifecycle hooks (auto-connect/disconnect)
- **PrismaModule**: Módulo global para inyección de dependencias
- **Schema Prisma**: Definición centralizada de la base de datos
- **Tipos generados**: Re-exportación de todos los tipos de `@prisma/client`

---

## 🚀 Uso en NestJS (apps/api)

### 1. Importar el módulo en `AppModule`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '@repo/database';

@Module({
  imports: [PrismaModule], // ⬅️ Solo una vez
  // ...
})
export class AppModule {}
```

### 2. Inyectar `PrismaService` en cualquier servicio

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/database';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async create(data: { email: string; name: string }) {
    return this.prisma.user.create({ data });
  }
}
```

### 3. Usar tipos generados

```typescript
import { User, Prisma } from '@repo/database';

// User es el tipo de un registro
const user: User = await prisma.user.findUnique({ where: { id: 1 } });

// Prisma contiene tipos de input/output
const data: Prisma.UserCreateInput = {
  email: 'test@example.com',
  name: 'John Doe',
};
```

---

## 🛠️ Scripts disponibles

| Comando           | Descripción                                |
|-------------------|--------------------------------------------|
| `pnpm db:generate`| Genera el cliente Prisma                   |
| `pnpm db:push`    | Sincroniza el schema con la BD (dev)       |
| `pnpm db:migrate` | Crea y aplica migraciones                  |
| `pnpm db:studio`  | Abre Prisma Studio (GUI)                   |
| `pnpm lint`       | Ejecuta ESLint con auto-fix                |
| `pnpm lint:check` | Ejecuta ESLint sin auto-fix (CI)           |

---

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` en `packages/database/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

### Schema Prisma

El schema se encuentra en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

// Agrega tus modelos aquí
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
```

---

## 📝 Características del PrismaService

### Auto-conexión al iniciar
El servicio se conecta automáticamente cuando NestJS inicia (`onModuleInit`).

### Auto-desconexión al cerrar
Se desconecta automáticamente al hacer shutdown (`onModuleDestroy`).

### Logging inteligente
- **Desarrollo**: Logs de `query`, `error`, `warn`
- **Producción**: Solo `error`

### Logger integrado de NestJS
Usa el logger nativo de NestJS con emojis para mejor legibilidad:
- ✅ Conexión exitosa
- 🔌 Desconexión
- ❌ Errores de conexión

---

## 🏗️ Arquitectura

```
packages/database/
├── prisma/
│   ├── schema.prisma        # Schema de la BD
│   └── migrations/          # Historial de migraciones
├── src/
│   ├── index.ts             # Exportaciones principales
│   ├── prisma.service.ts    # Servicio con lifecycle
│   └── prisma.module.ts     # Módulo global
├── .env                     # Variables de entorno
└── package.json
```

---

## 🔗 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Prisma Guide](https://docs.nestjs.com/recipes/prisma)
- [TypeScript ESLint](https://typescript-eslint.io/)
