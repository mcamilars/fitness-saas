# Plan de Desarrollo - Fitness SaaS

## Información General

### Descripción
Plataforma SaaS para entrenadores personales que permite gestionar clientes, crear planes de entrenamiento y nutrición, y hacer seguimiento del progreso.

### Stack Tecnológico
- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Backend:** NestJS 11 + TypeScript
- **Database:** PostgreSQL 16 (Docker)
- **ORM:** Prisma 6
- **Auth:** Clerk (Hobby Plan - 3 seats)

### Arquitectura del Proyecto
```
fitness-saas/
├── apps/
│   ├── api/        # NestJS (puerto 4000)
│   └── web/        # Next.js (puerto 3000)
├── packages/
│   └── database/   # Prisma schema + service
├── docs/
└── docker-compose.yml
```

---

## Modelo de Datos (Prisma)

### Entidades Principales

| Entidad | Descripción |
|---------|-------------|
| **EspacioDeTrabajo** | Workspace del entrenador (aislamiento multi-tenant) |
| **Usuario** | Usuario base (mapeado a Clerk) |
| **Entrenador** | Perfil de entrenador (1:1 con Usuario, 1:1 con EspacioDeTrabajo) |
| **Cliente** | Perfil de cliente (pertenece a un entrenador + workspace) |
| **PerfilDelCliente** | Datos personales del cliente (fechaNacimiento, objetivo, etc.) |
| **Ejercicio** | Catálogo global de ejercicios |
| **PlanDeEntrenamiento** | Plan con ejercicios (relación M:N con Ejercicio via EjercicioPlan) |
| **EjercicioPlan** | Tabla de unión: qué ejercicios tiene un plan con sus detalles |
| **PlanDeNutricion** | Plan nutricional con comidas |
| **Comida** | Comidas dentro de un plan nutricional |
| **AsignacionPlanEntrenamiento** | Relación N:N entre cliente y plan de entrenamiento |
| **AsignacionPlanNutricion** | Relación N:N entre cliente y plan nutricional |
| **RegistroDeEntrenamiento** | Registro de una sesión de workout |
| **RegistroDeEjercicio** | Ejercicio realizado dentro de un registro |
| **RegistroDeNutricion** | Registro de alimentación diaria |
| **RegistroBiometrico** | Registro de métricas corporales |

### Relaciones Clave

```
Entrenador → 1 EspacioDeTrabajo → N Clientes
Cliente → N AsignacionPlanEntrenamiento ← 1 PlanDeEntrenamiento → N EjercicioPlan → 1 Ejercicio
Cliente → N AsignacionPlanNutricion ← 1 PlanDeNutricion → N Comida
Cliente → N RegistroDeEntrenamiento → N RegistroDeEjercicio
Cliente → N RegistroDeNutricion
Cliente → N RegistroBiometrico
```

---

## Autenticación con Clerk

### Modelo de Datos → Clerk

```
Clerk Organization  →  EspacioDeTrabajo
Clerk User           →  Usuario (agregar clerkUserId)
Clerk Membership     →  Entrenador / Cliente
```

### Flujo de Auth

1. **Registro entrenador:** Clerk crea usuario → crear EspacioDeTrabajo en DB
2. **Invitar cliente:** Generar tokenDeInvitacion → compartir link
3. **Cliente se registra:** Clerk crea usuario → aceptar link → crear Cliente en DB
4. **Login:** Clerk JWT → backend verifica → extrae organizationId → filtra por workspace

### Cambios en Schema

```prisma
model Usuario {
  // Agregar
  clerkUserId    String   @unique
  
  // Eliminar (Clerk lo maneja)
  contrasenaHash String
  // Y la relación tokensDeRefresco
}
```

---

## Multi-tenancy

### Implementación

Cada entrenador tiene su propio `EspacioDeTrabajo`. Todos los datos de un entrenador están aislados por `espacioDeTrabajoId` o `entrenadorId`.

### Query Pattern

```typescript
// Todas las queries filtran por workspace
async getClientes(workspaceId: string) {
  return this.prisma.cliente.findMany({
    where: { espacioDeTrabajoId: workspaceId },
    include: { usuario: true, perfil: true },
  });
}
```

---

## Design Patterns a Implementar

### 1. Repository Pattern
Ubicación: `apps/api/src/modules/*/services/`

Ya implementado con PrismaService en cada módulo.

### 2. Factory Pattern  
Ubicación: `apps/api/src/common/factories/`

Para crear entidades con validaciones de negocio.

### 3. Builder Pattern
Ubicación: `apps/api/src/common/builders/`

Para construir queries/respuestas complejas (dashboard data).

### 4. Observer Pattern
Ubicación: `apps/api/src/common/events/`

Para reaccionar a eventos (ej: plan asignado → notificar cliente).

### 5. Decorator Pattern
Ubicación: `apps/api/src/common/decorators/`

Para logging, cache, timing transversal.

### 6. Strategy Pattern
Ubicación: `apps/api/src/common/strategies/`

Para algoritmos intercambiables (cálculo de progreso por objetivo).

---

## Plan de Implementación por Fases

### Fase 0: Setup ✅ (Completado)
- [x] Monorepo Turborepo
- [x] Next.js + NestJS
- [x] PostgreSQL Docker
- [x] Prisma schema
- [x] PrismaService

### Fase 1: Auth con Clerk
- [ ] Instalar Clerk SDKs
- [ ] Configurar ClerkProvider en Next.js
- [ ] Páginas SignIn/SignUp
- [ ] AuthGuard en NestJS
- [ ] Actualizar schema (agregar clerkUserId, eliminar contraseña)
- [ ] WorkspaceGuard

### Fase 2: Onboarding Trainer
- [ ] Crear Organization + EspacioDeTrabajo en registro
- [ ] Página de setup inicial
- [ ] Dashboard básico del trainer

### Fase 3: Gestión de Clientes
- [ ] Generar/validar token de invitación
- [ ] Página de invitación
- [ ] CRUD de clientes
- [ ] Perfil del cliente

### Fase 4: Planes de Entrenamiento
- [ ] CRUD de planes
- [ ] Agregar ejercicios al plan (EjercicioPlan)
- [ ] Catálogo de ejercicios
- [ ] Asignar plan a cliente

### Fase 5: Planes Nutricionales
- [ ] CRUD de planes nutricionales
- [ ] CRUD de comidas
- [ ] Asignar plan a cliente

### Fase 6: Registros
- [ ] Registrar entrenamiento (RegistroDeEntrenamiento + RegistroDeEjercicio)
- [ ] Registrar nutrición
- [ ] Registrar biométricos

### Fase 7: Dashboards
- [ ] Dashboard trainer (lista clientes, progreso individual)
- [ ] Dashboard cliente (mis planes, mi progreso)
- [ ] Gráficas con Recharts

---

## Dependencias a Agregar

### Frontend
```json
{
  "@clerk/nextjs": "^6.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0",
  "zod": "^3.22.0",
  "react-hook-form": "^7.48.0",
  "@hookform/resolvers": "^3.3.0",
  "recharts": "^2.10.0",
  "lucide-react": "^0.300.0",
  "date-fns": "^3.0.0",
  "sonner": "^1.3.0"
}
```

### Backend
```json
{
  "@clerk/clerk-sdk-express": "^6.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

---

## Dependencias Actuales del Proyecto

### packages/database/package.json
```json
{
  "@nestjs/common": "^11.0.1",
  "@prisma/client": "^6.4.0",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1"
}
```

### apps/api/package.json
```json
{
  "@nestjs/core": "^11.0.1",
  "@nestjs/common": "^11.0.1",
  "@nestjs/platform-express": "^11.0.1",
  "@repo/database": "workspace:*",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.1"
}
```

---

## Testing (Post-MVP)

### Unit Tests
- Services de cada módulo
- Validaciones de negocio
- Design patterns (Strategy, Factory, Builder)

### Integration Tests
- Endpoints REST con Supertest
- Prisma queries

### E2E Tests
- Flujo completo: registro → crear workspace → invitar cliente → crear plan → asignar → registrar workout

---

## Seguridad

### Multi-tenancy
- Todas las queries filtran por workspaceId
- WorkspaceGuard valida acceso
- Middleware inyecta workspaceId en request

### Auth
- Clerk maneja sesiones y tokens
- Backend solo verifica JWT
- Rate limiting en endpoints sensibles

### Data Validation
- class-validator en DTOs (backend)
- Zod en formularios (frontend)

---

## Métricas de Éxito

### Demo (3 seats Hobby)
- Trainer + 2 Clientes funcionando
- Crear y asignar planes
- Registrar workout
- Ver progreso en dashboard

### Producto
- Onboarding trainer < 10 min
- Crear plan < 5 min
- Registrar workout < 2 min
- Ver progreso instantáneo

---

## Recursos

- [Clerk Documentation](https://clerk.com/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://pris.ly/d/documentation)

---

**Fecha de creación:** Mayo 2024  
**Última actualización:** Mayo 2026  
**Versión:** 2.0 (simplificada, sin arquitectura hexagonal)