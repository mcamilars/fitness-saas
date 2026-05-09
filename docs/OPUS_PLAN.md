# OPUS PLAN — Plataforma SaaS para Entrenadores Personales

> Plan maestro de desarrollo simplificado: Design Patterns, Multi-tenancy con Workspaces, Auth con Clerk

---

## Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Monorepo](#3-arquitectura-del-monorepo)
4. [Modelo de Datos (Prisma)](#4-modelo-de-datos-prisma)
5. [Design Patterns](#5-design-patterns)
6. [Autenticación con Clerk](#6-autenticación-con-clerk)
7. [Multi-tenancy](#7-multi-tenancy)
8. [Plan de Implementación por Fases](#8-plan-de-implementación-por-fases)
9. [Métricas de Éxito](#9-métricas-de-éxito)

---

## 1. Visión General del Proyecto

### 1.1 Descripción

Plataforma web SaaS que permite a **entrenadores personales independientes** gestionar a sus clientes dentro de un workspace privado, registrar el progreso físico y generar planes de entrenamiento y nutrición personalizados.

### 1.2 Problema que Resuelve

Los entrenadores personales independientes hoy:
- Gestionan clientes con hojas de cálculo o papel
- No tienen forma centralizada de registrar progreso
- Pierden tiempo creando planes desde cero
- No pueden mostrar resultados claros a sus clientes
- No tienen visibilidad del avance real de cada persona

### 1.3 Propuesta de Valor

| Para el Entrenador | Para el Cliente |
|-------------------|-----------------|
| Dashboard unificado por cliente | Registro diario simple e intuitivo |
| Gráficas de progreso en tiempo real | Visualización de su propio progreso |
| Gestión de planes personalizados | Consulta de planes asignados |
| Seguimiento biométrico preciso | Registro de su propia actividad |

### 1.4 Alcance del MVP

**Incluye:**
- Gestión de workspace (cada entrenador tiene el suyo)
- Gestión de clientes con invitación por token
- Creación de planes de entrenamiento (con ejercicios del catálogo)
- Creación de planes nutricionales (con comidas)
- Asignación de planes a clientes
- Registro de entrenamientos (con ejercicios realizados)
- Registro de nutrición
- Registro biométrico
- Visualización de progreso

**Excluye (Post-MVP):**
- Pagos integrados
- Chat en tiempo real
- App móvil nativa
- Inteligencia artificial
- Gamificación (logros, rachas)
- Analítica avanzada
- SSO/SAML

### 1.5 Roles del Sistema

#### Entrenador
- Crea su cuenta y workspace
- Invita clientes mediante token único
- Crea y gestiona planes de entrenamiento y nutrición
- Asigna planes a clientes
- Registra biométricos de sus clientes
- Visualiza progreso de cada cliente

#### Cliente
- Se une al workspace mediante enlace de invitación
- Registra sus entrenamientos
- Registra su nutrición
- Visualiza sus planes asignados
- Ve su propio progreso

---

## 2. Stack Tecnológico

### Stack Confirmado en el Repositorio

| Capa | Tecnología | Versión |
|------|------------|---------|
| **Monorepo** | Turborepo | ^2.8.3 |
| **Package Manager** | pnpm | 9.0.0 |
| **Runtime** | Node.js | 22.20.0 |
| **Frontend** | Next.js (App Router) | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **CSS** | Tailwind CSS v4 | ^4 |
| **Backend** | NestJS | ^11.0.1 |
| **Database** | PostgreSQL 16 | (Docker) |
| **ORM** | Prisma | ^6.4.0 |
| **Auth** | Clerk | Hobby Plan |

### Dependencias a Agregar

#### Frontend (apps/web)
```
@clerk/nextjs           — Integración Clerk con Next.js
@tanstack/react-query   — Data fetching y cache
zustand                 — Estado global ligero
zod                     — Validación de schemas
react-hook-form         — Formularios
@hookform/resolvers     — Integración zod + react-hook-form
recharts                — Gráficas
lucide-react            — Iconos
date-fns                — Manejo de fechas
sonner                  — Notificaciones toast
```

#### Backend (apps/api)
```
@clerk/clerk-sdk-express — SDK de Clerk para verificar JWTs
class-validator          — Validación de DTOs
class-transformer        — Transformación de objetos
```

---

## 3. Arquitectura del Monorepo

### Estructura de Alto Nivel

```
fitness-saas/
├── apps/
│   ├── api/                    # NestJS Backend (Puerto 4000)
│   └── web/                    # Next.js Frontend (Puerto 3000)
├── packages/
│   └── database/               # @repo/database — Prisma + Service
├── docs/                       # Documentación
├── docker-compose.yml           # PostgreSQL 16
├── turbo.json                  # Pipeline de Turborepo
├── pnpm-workspace.yaml
└── package.json
```

### Estructura del Backend (simplificada)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── prisma.service.ts           # Servicio Prisma (ya existe)
├── modules/
│   ├── auth/                   # Auth con Clerk
│   │   ├── auth.module.ts
│   │   └── auth.guard.ts
│   ├── workspace/
│   ├── cliente/
│   ├── planEntrenamiento/
│   ├── planNutricion/
│   ├── ejercicio/
│   ├── registroEntrenamiento/
│   ├── registroNutricion/
│   └── registroBiometrico/
└── common/
    ├── decorators/
    ├── filters/
    └── interceptors/
```

---

## 4. Modelo de Datos (Prisma)

### Esquema Actual del MVP

```prisma
// Entidades principales ya implementadas:

EspacioDeTrabajo
├── id, nombre, slug
├── entrenador (1:1)
└── clientes (1:N)

Usuario (base user para auth)
├── id, correo, contrasenaHash, nombre, apellido, rol
├── entrenador (0:1)
├── cliente (0:1)
└── tokensDeRefresco

Entrenador
├── id, usuarioId, espacioDeTrabajoId (1:1 con EspacioDeTrabajo)
├── clientes (1:N)
├── planesDeEntrenamiento (1:N)
└── planesDeNutricion (1:N)

Cliente
├── id, usuarioId, entrenadorId, espacioDeTrabajoId
├── tokenDeInvitacion (único para invitación)
├── perfil (1:1)
├── asignacionesPlanesEntrenamiento (N:N via AsignacionPlanEntrenamiento)
├── asignacionesPlanesNutricion (N:N via AsignacionPlanNutricion)
├── registrosDeEntrenamiento (1:N)
├── registrosDeNutricion (1:N)
└── registrosBiometricos (1:N)

PerfilDelCliente
├── clienteId, fechaNacimiento, genero, telefono, objetivo, notas

Ejercicio (catálogo global de ejercicios)
├── id, nombre, grupoMuscular, descripcion, instrucciones, imagenUrl, videoUrl
└── ejercicioPlanes (N:N con PlanDeEntrenamiento)

PlanDeEntrenamiento
├── id, entrenadorId, nombre, descripcion, estado
├── ejercicioPlanes (1:N) — relación M:N con Ejercicio
└── asignaciones (1:N via AsignacionPlanEntrenamiento)

AsignacionPlanEntrenamiento
├── clienteId, planDeEntrenamientoId, estado, asignadoEn
└── @@unique([clienteId, planDeEntrenamientoId])

PlanDeNutricion
├── id, entrenadorId, nombre, descripcion, caloriasTotales, estado
├── comidas (1:N)
└── asignaciones (1:N via AsignacionPlanNutricion)

Comida
├── id, planDeNutricionId, nombre, calorias, proteina, carbos, grasa, orden

AsignacionPlanNutricion
├── clienteId, planDeNutricionId, estado, asignadoEn
└── @@unique([clienteId, planDeNutricionId])

RegistroDeEntrenamiento
├── id, clienteId, fecha, notas, duracionMin
└── ejercicios (1:N)

RegistroDeEjercicio
├── id, registroDeEntrenamientoId, nombre, grupoMuscular, series, repeticiones, pesoKg

RegistroDeNutricion
├── id, clienteId, fecha, descripcion, calorias, proteina, carbos, grasa

RegistroBiometrico
├── id, clienteId, fecha, pesoKg, alturaCm, porcentajeGrasaCorporal, masaMuscularKg,
│   cinturaCm, caderaCm, pechoCm, brazoCm, piernaCm
```

### Cambios a Realizar para Clerk

1. **Eliminar `RefreshToken`** — Clerk maneja sesiones
2. **Eliminar `contrasenaHash`** — Clerk maneja auth
3. **Agregar `clerkUserId`** a `Usuario` — para mapear con Clerk

---

## 5. Design Patterns

### 5.1 Repository Pattern

Implementado con PrismaService + decoradores de NestJS. Cada módulo tiene su servicio que actúa como repositorio.

**Dónde:** `apps/api/src/modules/*/services/`

```typescript
// apps/api/src/modules/cliente/cliente.service.ts
@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.cliente.findUnique({ where: { id } });
  }

  async findByEntrenadorId(entrenadorId: string) {
    return this.prisma.cliente.findMany({ where: { entrenadorId } });
  }
}
```

---

### 5.2 Factory Pattern

Para crear entidades con validaciones de negocio.

**Dónde:** `apps/api/src/common/factories/`

```typescript
// common/factories/plan-entrenamiento.factory.ts
export class PlanEntrenamientoFactory {
  static create(data: CreatePlanDto, entrenadorId: string): PlanDeEntrenamiento {
    if (!data.nombre || data.nombre.trim() === '') {
      throw new BadRequestException('El nombre del plan es requerido');
    }
    
    return this.prisma.planDeEntrenamiento.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion,
        entrenadorId,
        estado: 'BORRADOR',
      },
    });
  }
}
```

---

### 5.3 Builder Pattern

Para construcción de queries complejas o respuestas DTO.

**Dónde:** `apps/api/src/common/builders/`

```typescript
// common/builders/dashboard-trainer.builder.ts
export class DashboardTrainerBuilder {
  private clienteId?: string;
  private includeBiometricos = false;
  private includePlanes = false;

  forCliente(clienteId: string): this {
    this.clienteId = clienteId;
    return this;
  }

  withBiometricos(): this {
    this.includeBiometricos = true;
    return this;
  }

  withPlanes(): this {
    this.includePlanes = true;
    return this;
  }

  async build(prisma: PrismaService) {
    const cliente = await prisma.cliente.findUnique({
      where: { id: this.clienteId },
      include: { perfil: true },
    });

    const data: any = { cliente };

    if (this.includeBiometricos) {
      data.biometricos = await prisma.registroBiometrico.findMany({
        where: { clienteId: this.clienteId },
        orderBy: { fecha: 'desc' },
        take: 30,
      });
    }

    if (this.includePlanes) {
      data.planesActivos = await prisma.asignacionPlanEntrenamiento.findMany({
        where: { clienteId: this.clienteId, estado: 'ACTIVO' },
        include: { planDeEntrenamiento: true },
      });
    }

    return data;
  }
}
```

---

### 5.4 Observer Pattern (Domain Events)

Para reaccionar a eventos de negocio (ej: cuando se asigna un plan).

**Dónde:** `apps/api/src/common/events/`

```typescript
// common/events/plan-asignado.event.ts
export class PlanAsignadoEvent {
  constructor(
    public readonly clienteId: string,
    public readonly planId: string,
    public readonly tipo: 'ENTRENAMIENTO' | 'NUTRICION',
  ) {}
}

// Handler en el módulo correspondiente
@Injectable()
export class PlanEventHandler {
  @OnEvent('plan.asignado')
  async handle(event: PlanAsignadoEvent) {
    // Notificar al cliente, actualizar dashboard, etc.
  }
}
```

---

### 5.5 Decorator Pattern

Para funcionalidades transversales (logging, cache, timing).

**Dónde:** `apps/api/src/common/decorators/`

```typescript
// decorators/log-execution.decorator.ts
export function LogExecution() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      console.log(`[${target.constructor.name}] ${propertyKey} ▶`);
      try {
        const result = await originalMethod.apply(this, args);
        console.log(`[${target.constructor.name}] ${propertyKey} ✅ ${Date.now() - start}ms`);
        return result;
      } catch (error) {
        console.log(`[${target.constructor.name}] ${propertyKey} ❌ ${Date.now() - start}ms`);
        throw error;
      }
    };
    return descriptor;
  };
}
```

---

### 5.6 Strategy Pattern

Para algoritmos intercambiables (ej: cálculo de progreso por tipo de objetivo).

**Dónde:** `apps/api/src/common/strategies/`

```typescript
// strategies/progreso-calculator.strategy.ts
interface ProgresoCalculator {
  calcular(biometricos: RegistroBiometrico[]): ProgresoReport;
}

class CalculadorPerdidaPeso implements ProgresoCalculator {
  calcular(biometricos: RegistroBiometrico[]): ProgresoReport {
    // Lógica para pérdida de peso
  }
}

class CalculadorGananciaMuscular implements ProgresoCalculator {
  calcular(biometricos: RegistroBiometrico[]): ProgresoReport {
    // Lógica para ganancia muscular
  }
}

// Factory para obtener el strategy correcto
class ProgresoStrategyFactory {
  static getStrategy(objetivo: string): ProgresoCalculator {
    switch (objetivo) {
      case 'PERDIDA_PESO': return new CalculadorPerdidaPeso();
      case 'GANANCIA_MUSCULAR': return new CalculadorGananciaMuscular();
      default: return new CalculadorPerdidaPeso();
    }
  }
}
```

---

### 5.7 Resumen de Patterns

| Pattern | Propósito | Ubicación |
|---------|-----------|-----------|
| **Repository** | Abstraer acceso a datos | `modules/*/services/` |
| **Factory** | Crear entidades válidas | `common/factories/` |
| **Builder** | Construir queries/respuestas complejas | `common/builders/` |
| **Observer** | Reaccionar a eventos de negocio | `common/events/` |
| **Decorator** | Cross-cutting concerns (logging) | `common/decorators/` |
| **Strategy** | Algoritmos intercambiables | `common/strategies/` |

---

## 6. Autenticación con Clerk

### 6.1 Arquitectura de Auth

Clerk maneja toda la autenticación. El backend solo verifica JWTs.

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js + Clerk)                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ <SignIn /> <SignUp /> <UserButton />             │  │
│  │ Clerk SDK → Session JWT → Cookie                 │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │ Authorization: Bearer {jwt}
                             ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (NestJS + @clerk/clerk-sdk-express)           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ clerkMiddleware() → authenticateRequest()        │  │
│  │ Extrae: userId, organizationId (workspaceId)     │  │
│  │ Injecta en request.context                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Modelo de Clerk → Tu Schema

```
Clerk Organization  →  EspacioDeTrabajo
Clerk User           →  Usuario
Clerk Membership     →  Entrenador / Cliente
```

### 6.3 Flujo de Onboarding

1. **Entrenador se registra** via Clerk
2. **Crea su EspacioDeTrabajo** en tu DB
3. **Crea Organization en Clerk** vinculada al workspace
4. **Invita clientes** → genera `tokenDeInvitacion`
5. **Cliente se registra** → Clerk crea User
6. **Cliente acepta invitación** → Se crea Cliente en tu DB
7. **Asignas membership** → Cliente tiene acceso al workspace

### 6.4 Middleware de Auth en NestJS

```typescript
// modules/auth/auth.guard.ts
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      const payload = await verifyToken(token); // Clerk SDK
      request.user = {
        clerkUserId: payload.sub,
        organizationId: payload.org_id,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### 6.5 Workspace Guard

```typescript
// common/guards/workspace.guard.ts
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { organizationId } = request.user; // Del ClerkAuthGuard
    
    const espacio = await this.prisma.espacioDeTrabajo.findFirst({
      where: { slug: organizationId },
    });
    
    if (!espacio) {
      throw new NotFoundException('Workspace not found');
    }
    
    request.workspace = espacio;
    return true;
  }
}
```

### 6.6 Cambios en Schema para Clerk

```prisma
model Usuario {
  id             String   @id @default(uuid())
  clerkUserId    String   @unique  // ← NUEVO: mapear con Clerk
  correo         String   @unique
  nombre         String
  apellido       String
  rol            Rol
  // Eliminar: contrasenaHash (Clerk lo maneja)
  // Eliminar: tokensDeRefresco (Clerk lo maneja)
  
  // ... resto de relaciones
}
```

---

## 7. Multi-tenancy

### 7.1 Modelo Implementado

Tu schema ya tiene multi-tenancy basado en `EspacioDeTrabajo`:

```
┌─────────────────────────────────────────────────────────┐
│                    SINGLE DATABASE                       │
├─────────────────────────────────────────────────────────┤
│  EspacioDeTrabajo A (Trainer: Juan)                     │
│    ├── Clientes: María, Pedro                            │
│    ├── Planes: 5 planes de entrenamiento                │
│    └── Registros: todos los datos                       │
├─────────────────────────────────────────────────────────┤
│  EspacioDeTrabajo B (Trainer: Ana)                      │
│    ├── Clientes: Luis, Carlos                           │
│    ├── Planes: 3 planes                                 │
│    └── Registros: todos los datos                       │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Row-Level Security

Todas las queries filtran por `espacioDeTrabajoId` o `entrenadorId`.

```typescript
// Ejemplo: Obtener clientes del trainer actual
async getClientes(workspaceId: string) {
  return this.prisma.cliente.findMany({
    where: { espacioDeTrabajoId: workspaceId },
    include: { usuario: true, perfil: true },
  });
}
```

### 7.3 Middleware de Tenant

```typescript
// common/middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const { organizationId } = req.user; // De Clerk
    
    if (organizationId) {
      const workspace = await this.prisma.espacioDeTrabajo.findUnique({
        where: { slug: organizationId },
      });
      
      if (workspace) {
        req.workspaceId = workspace.id;
        req.entrenadorId = workspace.entrenador?.id;
      }
    }
    
    next();
  }
}
```

### 7.4 Beneficios del Modelo

| Aspecto | Resultado |
|---------|-----------|
| **Aislamiento** | Trainer A jamás ve datos del Trainer B |
| **Costo** | Un solo PostgreSQL, no uno por trainer |
| **Escalabilidad** | Índices correctos, maneja millones de rows |
| **Mantención** | Un solo deployment, un solo backup |
| **Compliance** | Transacciones.atomic() funciona跨 workspace |

---

## 8. Plan de Implementación por Fases

### Fase 0: Setup (Completado ✅)
- [x] Monorepo con Turborepo
- [x] Next.js + NestJS
- [x] PostgreSQL en Docker
- [x] Prisma schema con todas las entidades
- [x] PrismaService implementado

### Fase 1: Auth con Clerk (Semana 1)
- [ ] Instalar `@clerk/nextjs` y `@clerk/clerk-sdk-express`
- [ ] Configurar Clerk Provider en Next.js
- [ ] Crear páginas de SignIn/SignUp
- [ ] Crear ClerkAuthGuard para NestJS
- [ ] Actualizar schema: agregar `clerkUserId`, eliminar `contrasenaHash`
- [ ] Crear WorkspaceGuard
- [ ] Migrar datos si hay usuarios existentes

### Fase 2: Onboarding Trainer (Semana 2)
- [ ] Crear Organization en Clerk al registrarse
- [ ] Crear EspacioDeTrabajo en DB al mismo tiempo
- [ ] Página de setup inicial (nombre del workspace, slug)
- [ ] Redirección post-registro

### Fase 3: Invitación de Clientes (Semana 2-3)
- [ ] Generar `tokenDeInvitacion` único
- [ ] Página de aceptación de invitación
- [ ] Crear Cliente + Usuario al aceptar
- [ ] Vincular al workspace correcto

### Fase 4: CRUD Planes de Entrenamiento (Semana 3-4)
- [ ] Endpoints para crear/editar/borrar planes
- [ ] CRUD de EjercicioPlan (agregar ejercicios al plan)
- [ ] Catálogo de ejercicios
- [ ] Endpoints para asignar planes a clientes

### Fase 5: CRUD Planes Nutricionales (Semana 4)
- [ ] Endpoints para crear/editar/borrar planes nutricionales
- [ ] CRUD de Comidas dentro del plan
- [ ] Asignación a clientes

### Fase 6: Registro de Entrenamientos (Semana 5)
- [ ] Endpoint para registrar entrenamiento
- [ ] Registrar ejercicios realizados
- [ ] Endpoint para ver historial

### Fase 7: Registro de Nutrición (Semana 5-6)
- [ ] Endpoint para registrar nutrición diaria
- [ ] Ver historial de nutrición

### Fase 8: Registro Biométrico (Semana 6)
- [ ] Endpoint para registrar biométricos
- [ ] Ver historial biométrico

### Fase 9: Dashboard del Trainer (Semana 7)
- [ ] Lista de clientes
- [ ] Dashboard individual por cliente
- [ ] Gráficas de progreso (peso, adherencia)

### Fase 10: Dashboard del Cliente (Semana 8)
- [ ] Vista de sus planes asignados
- [ ] Su progreso
- [ ] Sus registros

---

## 9. Métricas de Éxito

### MVP Demo (3 seats Clerk Hobby)
- Demo con Trainer + 2 Clientes funcionando
- Creación de planes funcional
- Registro de entrenamiento funcional
- Visualización de progreso básica

### Producto
- Onboarding < 10 minutos
- Trainer puede crear plan en < 5 minutos
- Cliente registra workout en < 2 minutos