# 🏋️ OPUS PLAN — Plataforma SaaS para Entrenadores Personales

> Plan maestro de desarrollo con Arquitectura Hexagonal, Clean Architecture y Design Patterns

---

## 📋 Tabla de Contenidos

1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Monorepo](#3-arquitectura-del-monorepo)
4. [Arquitectura Hexagonal + Clean Architecture](#4-arquitectura-hexagonal--clean-architecture)
5. [Modelo de Dominio](#5-modelo-de-dominio)
6. [Design Patterns](#6-design-patterns)
7. [Modelo de Base de Datos](#7-modelo-de-base-de-datos)
8. [API REST — Endpoints](#8-api-rest--endpoints)
9. [Frontend — Estructura y Páginas](#9-frontend--estructura-y-páginas)
10. [Sistema de IA](#10-sistema-de-ia)
11. [Multi-tenancy y Seguridad](#11-multi-tenancy-y-seguridad)
12. [Estrategia de Testing](#12-estrategia-de-testing)
13. [Plan de Implementación por Fases](#13-plan-de-implementación-por-fases)
14. [DevOps y Deployment](#14-devops-y-deployment)
15. [Métricas de Éxito](#15-métricas-de-éxito)
16. [Futuras Mejoras (Post-MVP)](#16-futuras-mejoras-post-mvp)

---

## 1. Visión General del Proyecto

### 1.1 Descripción

Plataforma web SaaS que permite a **entrenadores personales independientes** gestionar a sus clientes dentro de un workspace privado, registrar y visualizar el progreso físico, y obtener recomendaciones automáticas y generación de planes mediante inteligencia artificial.

### 1.2 Problema que Resuelve

Los entrenadores independientes carecen de herramientas integradas, asequibles y simples para:

- Centralizar el seguimiento de sus clientes en un solo lugar.
- Visualizar el progreso de forma gráfica y accionable.
- Generar planes personalizados sin invertir horas de planificación manual.
- Mantener motivados a sus clientes con feedback continuo.

### 1.3 Propuesta de Valor

| Para el Entrenador                  | Para el Cliente                            |
| ----------------------------------- | ------------------------------------------ |
| Dashboard unificado por cliente     | Registro diario simple e intuitivo         |
| Gráficas de progreso en tiempo real | Visualización de su propio progreso        |
| Resumen semanal generado por IA     | Resumen semanal y motivación personalizada |
| Generación de planes con IA         | Consulta de planes asignados               |
| Gestión mediante workspace aislado  | Gamificación: rachas, logros, cumplimiento |

### 1.4 Alcance del MVP

**Incluye:**

- Gestión de entrenadores y clientes mediante workspaces.
- Registro de entrenamientos, nutrición básica y biométricos.
- Visualización de progreso con gráficas.
- Resumen semanal, recomendaciones y generación de planes usando IA.
- Experiencia simple para clientes con gamificación básica.

**Excluye (Post-MVP):**

- Pagos integrados (Stripe).
- Chat en tiempo real (Socket.io/WebSockets).
- App móvil nativa (React Native).
- Marketplace de planes/rutinas.
- Reconocimiento de alimentos por imagen.
- Analítica avanzada o comparaciones entre clientes.
- Integración con wearables.

### 1.5 Roles del Sistema

#### Entrenador (TRAINER)

- Crear cuenta y workspace.
- Invitar clientes mediante enlace único.
- Visualizar dashboard individual por cliente.
- Revisar métricas, gráficas y resumen semanal IA.
- Generar planes de entrenamiento y alimentación con IA.

#### Cliente (CLIENT)

- Unirse al workspace mediante enlace de invitación.
- Registrar datos de entrenamiento, nutrición y salud.
- Visualizar su progreso en gráficas simples.
- Consultar su plan asignado.
- Recibir resumen semanal y motivación.
- Participar en gamificación (rachas, cumplimiento, logros).

---

## 2. Stack Tecnológico

### 2.1 Stack Actual (Confirmado en el Repositorio)

| Capa                | Tecnología                        | Versión          |
| ------------------- | --------------------------------- | ---------------- |
| **Monorepo**        | Turborepo                         | ^2.8.3           |
| **Package Manager** | pnpm                              | 9.0.0            |
| **Runtime**         | Node.js                           | 22.20.0          |
| **Frontend**        | Next.js (App Router)              | 16.1.6           |
| **UI Library**      | React                             | 19.2.3           |
| **CSS**             | Tailwind CSS v4                   | ^4               |
| **Backend**         | NestJS                            | ^11.0.1          |
| **Platform**        | Express                           | ^11.0.1          |
| **Language**        | TypeScript                        | 5.9.2            |
| **Database**        | PostgreSQL                        | 16 (Docker)      |
| **ORM**             | Prisma                            | Por instalar     |
| **Testing**         | Jest + Supertest                  | ^30.0.0 / ^7.0.0 |
| **Linting**         | ESLint 9 (Flat Config) + Prettier | Configurado      |

### 2.2 Dependencias Adicionales a Instalar

#### Backend (apps/api)

```
@nestjs/config          — Variables de entorno
@nestjs/event-emitter   — Eventos de dominio (Observer Pattern)
@prisma/client          — ORM client
prisma                  — CLI
class-validator         — Validación de DTOs
class-transformer       — Transformación de objetos
bcrypt                  — Hash de passwords
uuid                    — Generación de IDs
openai                  — SDK de OpenAI (IA)
@nestjs/throttler       — Rate limiting
```

#### Frontend (apps/web)

```
next-auth@5             — Autenticación
@tanstack/react-query   — Data fetching y cache
zustand                 — Estado global ligero
zod                     — Validación de schemas
react-hook-form         — Formularios
@hookform/resolvers     — Integración zod + react-hook-form
recharts                — Gráficas
shadcn/ui               — Componentes UI
lucide-react            — Iconos
date-fns                — Manejo de fechas
sonner                  — Notificaciones toast
```

#### Shared (packages/)

```
@repo/types             — Tipos compartidos, enums, interfaces
@repo/ui                — Componentes UI reutilizables (si aplica)
@repo/config            — Configuraciones compartidas (ESLint, TS)
```

---

## 3. Arquitectura del Monorepo

### 3.1 Estructura de Alto Nivel

```
fitness-saas/
├── apps/
│   ├── api/                    # NestJS Backend (Puerto 4000)
│   └── web/                    # Next.js Frontend (Puerto 3000)
├── packages/
│   ├── types/                  # @repo/types — Tipos compartidos
│   ├── ui/                     # @repo/ui — Componentes UI compartidos
│   └── config/                 # @repo/config — Configs compartidas
├── docs/                       # Documentación del proyecto
├── docker-compose.yml          # PostgreSQL 16
├── turbo.json                  # Pipeline de Turborepo
├── pnpm-workspace.yaml         # Definición de workspaces
├── package.json                # Scripts raíz
├── .nvmrc                      # Node 22.20.0
└── .gitignore
```

### 3.2 Pipeline de Turborepo (turbo.json)

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "check-types": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "test:e2e": { "dependsOn": ["build"] }
  }
}
```

### 3.3 Scripts del Monorepo

| Script       | Comando                                | Descripción                 |
| ------------ | -------------------------------------- | --------------------------- |
| `dev`        | `turbo run dev`                        | Desarrollo (todos los apps) |
| `dev:web`    | `turbo run dev --filter=web`           | Solo frontend               |
| `dev:api`    | `turbo run dev --filter=api`           | Solo backend                |
| `build`      | `turbo run build`                      | Build de producción         |
| `lint`       | `turbo run lint`                       | Linting                     |
| `test`       | `turbo run test`                       | Unit tests                  |
| `test:e2e`   | `turbo run test:e2e`                   | E2E tests                   |
| `db:up`      | `docker compose up -d`                 | Levantar PostgreSQL         |
| `db:down`    | `docker compose down`                  | Bajar PostgreSQL            |
| `db:migrate` | `pnpm --filter api prisma migrate dev` | Migración                   |
| `db:seed`    | `pnpm --filter api prisma db seed`     | Seed data                   |
| `db:studio`  | `pnpm --filter api prisma studio`      | Prisma Studio               |

---

## 4. Arquitectura Hexagonal + Clean Architecture

### 4.1 Principios Fundamentales

La arquitectura se basa en la combinación de **Hexagonal Architecture** (Ports & Adapters) de Alistair Cockburn y **Clean Architecture** de Robert C. Martin, con los siguientes principios:

1. **Dependency Rule:** Las dependencias siempre apuntan hacia adentro (hacia el dominio).
2. **Independencia del Framework:** El dominio y la aplicación no conocen NestJS ni Prisma.
3. **Independencia de la UI:** La lógica no depende del frontend.
4. **Independencia de la Base de Datos:** El dominio usa interfaces (Ports), no implementaciones concretas.
5. **Testabilidad:** Cada capa se puede testear de forma aislada.

### 4.2 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│          (Controllers, Middleware, Validators)                │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                APPLICATION LAYER                     │   │
│   │        (Use Cases, DTOs, Application Ports)          │   │
│   │   ┌─────────────────────────────────────────────┐   │   │
│   │   │              DOMAIN LAYER                    │   │   │
│   │   │   (Entities, Value Objects, Domain Ports,    │   │   │
│   │   │    Domain Services, Domain Events,           │   │   │
│   │   │    Domain Exceptions)                        │   │   │
│   │   └─────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────┘   │
│                    INFRASTRUCTURE LAYER                       │
│   (Prisma Repositories, External Adapters, Config, Guards)   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Flujo de una Request

```
HTTP Request
    │
    ▼
┌──────────────┐
│  Controller  │ ──── Presentation Layer
│  (Adapter In)│       - Valida input (class-validator)
└──────┬───────┘       - Transforma a DTO
       │
       ▼
┌──────────────┐
│   Use Case   │ ──── Application Layer
│              │       - Orquesta lógica de negocio
└──────┬───────┘       - Usa ports para dependencias
       │
       ▼
┌──────────────┐
│   Domain     │ ──── Domain Layer
│   Entity/    │       - Valida reglas de negocio
│   Service    │       - Emite eventos de dominio
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │ ──── Infrastructure Layer
│  (Adapter Out)│      - Persiste en PostgreSQL via Prisma
└──────────────┘       - Mapea entre dominio e infraestructura
```

### 4.4 Estructura del Backend (apps/api/src)

```
apps/api/src/
│
├── main.ts                          # Bootstrap NestJS
├── app.module.ts                    # Root module
│
├── domain/                          # 🟢 DOMAIN LAYER (Núcleo puro)
│   ├── entities/                    # Entidades de dominio con comportamiento
│   │   ├── user.entity.ts
│   │   ├── workspace.entity.ts
│   │   ├── workspace-member.entity.ts
│   │   ├── client.entity.ts
│   │   ├── workout.entity.ts
│   │   ├── nutrition.entity.ts
│   │   ├── biometric.entity.ts
│   │   ├── plan.entity.ts
│   │   └── achievement.entity.ts
│   │
│   ├── value-objects/               # Objetos de valor inmutables
│   │   ├── email.vo.ts
│   │   ├── password.vo.ts
│   │   ├── weight.vo.ts
│   │   ├── percentage.vo.ts
│   │   ├── blood-pressure.vo.ts
│   │   ├── date-range.vo.ts
│   │   └── invite-code.vo.ts
│   │
│   ├── repositories/                # Ports (Interfaces de repositorios)
│   │   ├── user.repository.port.ts
│   │   ├── workspace.repository.port.ts
│   │   ├── client.repository.port.ts
│   │   ├── workout.repository.port.ts
│   │   ├── nutrition.repository.port.ts
│   │   ├── biometric.repository.port.ts
│   │   ├── plan.repository.port.ts
│   │   └── achievement.repository.port.ts
│   │
│   ├── services/                    # Servicios de dominio
│   │   ├── progress-calculator.service.ts
│   │   ├── streak-calculator.service.ts
│   │   └── achievement-unlocker.service.ts
│   │
│   ├── strategies/                  # Strategy Pattern (algoritmos de cálculo)
│   │   ├── progress-strategy.interface.ts
│   │   ├── weight-loss-progress.strategy.ts
│   │   ├── muscle-gain-progress.strategy.ts
│   │   ├── maintenance-progress.strategy.ts
│   │   └── athletic-performance-progress.strategy.ts
│   │
│   ├── events/                      # Eventos de dominio
│   │   ├── domain-event.base.ts
│   │   ├── workout-registered.event.ts
│   │   ├── biometric-recorded.event.ts
│   │   ├── streak-updated.event.ts
│   │   └── achievement-unlocked.event.ts
│   │
│   ├── factories/                   # Factory Pattern
│   │   ├── workout.factory.ts
│   │   ├── nutrition.factory.ts
│   │   ├── biometric.factory.ts
│   │   └── plan.factory.ts
│   │
│   ├── exceptions/                  # Excepciones de dominio
│   │   ├── domain.exception.ts
│   │   ├── entity-not-found.exception.ts
│   │   ├── validation.exception.ts
│   │   ├── unauthorized-access.exception.ts
│   │   └── business-rule-violation.exception.ts
│   │
│   └── enums/                       # Enums de dominio
│       ├── role.enum.ts
│       ├── goal.enum.ts
│       ├── gender.enum.ts
│       ├── activity-level.enum.ts
│       ├── plan-type.enum.ts
│       └── achievement-type.enum.ts
│
├── application/                     # 🔵 APPLICATION LAYER
│   ├── use-cases/                   # Casos de uso (1 acción = 1 use case)
│   │   ├── auth/
│   │   │   ├── register-user.use-case.ts
│   │   │   ├── login-user.use-case.ts
│   │   │   └── validate-session.use-case.ts
│   │   ├── workspace/
│   │   │   ├── create-workspace.use-case.ts
│   │   │   ├── generate-invite-link.use-case.ts
│   │   │   ├── join-workspace.use-case.ts
│   │   │   └── get-workspace-members.use-case.ts
│   │   ├── client/
│   │   │   ├── create-client-profile.use-case.ts
│   │   │   ├── update-client-profile.use-case.ts
│   │   │   └── get-client-profile.use-case.ts
│   │   ├── workout/
│   │   │   ├── register-workout.use-case.ts
│   │   │   ├── get-client-workouts.use-case.ts
│   │   │   ├── update-workout.use-case.ts
│   │   │   └── mark-workout-completed.use-case.ts
│   │   ├── nutrition/
│   │   │   ├── register-nutrition.use-case.ts
│   │   │   ├── get-client-nutrition.use-case.ts
│   │   │   └── update-nutrition.use-case.ts
│   │   ├── biometric/
│   │   │   ├── register-biometric.use-case.ts
│   │   │   ├── get-client-biometrics.use-case.ts
│   │   │   └── update-biometric.use-case.ts
│   │   ├── dashboard/
│   │   │   ├── get-trainer-dashboard.use-case.ts
│   │   │   ├── get-client-dashboard.use-case.ts
│   │   │   └── get-progress-report.use-case.ts
│   │   ├── plan/
│   │   │   ├── assign-plan.use-case.ts
│   │   │   ├── get-active-plan.use-case.ts
│   │   │   ├── get-plan-history.use-case.ts
│   │   │   └── update-plan.use-case.ts
│   │   ├── gamification/
│   │   │   ├── check-and-unlock-achievements.use-case.ts
│   │   │   └── get-client-achievements.use-case.ts
│   │   └── ai/
│   │       ├── generate-weekly-summary.use-case.ts
│   │       ├── generate-recommendations.use-case.ts
│   │       ├── generate-workout-plan.use-case.ts
│   │       └── generate-nutrition-plan.use-case.ts
│   │
│   ├── dto/                         # Data Transfer Objects (entrada/salida)
│   │   ├── auth/
│   │   │   ├── register-user.dto.ts
│   │   │   └── login-user.dto.ts
│   │   ├── workspace/
│   │   │   ├── create-workspace.dto.ts
│   │   │   └── join-workspace.dto.ts
│   │   ├── client/
│   │   │   ├── create-client-profile.dto.ts
│   │   │   └── client-dashboard.dto.ts
│   │   ├── workout/
│   │   │   ├── create-workout.dto.ts
│   │   │   └── workout-response.dto.ts
│   │   ├── nutrition/
│   │   │   ├── create-nutrition.dto.ts
│   │   │   └── nutrition-response.dto.ts
│   │   ├── biometric/
│   │   │   ├── create-biometric.dto.ts
│   │   │   └── biometric-response.dto.ts
│   │   ├── plan/
│   │   │   ├── generate-plan.dto.ts
│   │   │   └── plan-response.dto.ts
│   │   └── ai/
│   │       ├── weekly-summary.dto.ts
│   │       └── recommendation.dto.ts
│   │
│   ├── ports/                       # Puertos de salida (servicios externos)
│   │   ├── ai-service.port.ts
│   │   ├── email-service.port.ts
│   │   └── notification-service.port.ts
│   │
│   ├── mappers/                     # Mappers entre capas
│   │   ├── user.mapper.ts
│   │   ├── workspace.mapper.ts
│   │   ├── client.mapper.ts
│   │   ├── workout.mapper.ts
│   │   ├── nutrition.mapper.ts
│   │   ├── biometric.mapper.ts
│   │   └── plan.mapper.ts
│   │
│   ├── builders/                    # Builder Pattern
│   │   └── dashboard-query.builder.ts
│   │
│   ├── decorators/                  # Decorator Pattern
│   │   ├── log-execution.decorator.ts
│   │   └── cache-result.decorator.ts
│   │
│   ├── validators/                  # Chain of Responsibility Pattern
│   │   ├── validation-handler.base.ts
│   │   ├── workout-data-validator.ts
│   │   ├── biometric-range-validator.ts
│   │   └── nutrition-data-validator.ts
│   │
│   └── event-handlers/              # Handlers para eventos de dominio
│       ├── update-streak.handler.ts
│       ├── check-achievements.handler.ts
│       └── notify-trainer.handler.ts
│
├── infrastructure/                  # 🟠 INFRASTRUCTURE LAYER (Adaptadores)
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── prisma.service.ts        # Servicio Prisma para NestJS
│   │   └── repositories/            # Implementaciones concretas (Adapters)
│   │       ├── prisma-user.repository.ts
│   │       ├── prisma-workspace.repository.ts
│   │       ├── prisma-client.repository.ts
│   │       ├── prisma-workout.repository.ts
│   │       ├── prisma-nutrition.repository.ts
│   │       ├── prisma-biometric.repository.ts
│   │       ├── prisma-plan.repository.ts
│   │       └── prisma-achievement.repository.ts
│   │
│   ├── adapters/                    # Adaptadores de servicios externos
│   │   ├── ai/
│   │   │   ├── openai.adapter.ts
│   │   │   └── mock-ai.adapter.ts   # Para testing/desarrollo
│   │   ├── email/
│   │   │   └── email-service.adapter.ts
│   │   └── notification/
│   │       └── notification-service.adapter.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   ├── ai.config.ts
│   │   └── app.config.ts
│   │
│   └── guards/
│       ├── auth.guard.ts
│       ├── roles.guard.ts
│       └── workspace-membership.guard.ts
│
├── presentation/                    # 🟣 PRESENTATION LAYER
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── workspace.controller.ts
│   │   ├── client.controller.ts
│   │   ├── trainer.controller.ts
│   │   ├── workout.controller.ts
│   │   ├── nutrition.controller.ts
│   │   ├── biometric.controller.ts
│   │   ├── plan.controller.ts
│   │   ├── gamification.controller.ts
│   │   └── ai.controller.ts
│   │
│   ├── middleware/
│   │   ├── tenant-context.middleware.ts
│   │   ├── request-logger.middleware.ts
│   │   └── correlation-id.middleware.ts
│   │
│   ├── filters/
│   │   ├── domain-exception.filter.ts
│   │   └── http-exception.filter.ts
│   │
│   ├── interceptors/
│   │   ├── response-transform.interceptor.ts
│   │   └── timeout.interceptor.ts
│   │
│   └── pipes/
│       └── validation.pipe.ts
│
└── modules/                         # Módulos NestJS (wiring)
    ├── auth/
    │   └── auth.module.ts
    ├── workspace/
    │   └── workspace.module.ts
    ├── client/
    │   └── client.module.ts
    ├── workout/
    │   └── workout.module.ts
    ├── nutrition/
    │   └── nutrition.module.ts
    ├── biometric/
    │   └── biometric.module.ts
    ├── dashboard/
    │   └── dashboard.module.ts
    ├── plan/
    │   └── plan.module.ts
    ├── gamification/
    │   └── gamification.module.ts
    ├── ai/
    │   └── ai.module.ts
    └── shared/
        └── shared.module.ts         # PrismaService, Guards, etc.
```

---

## 5. Modelo de Dominio

### 5.1 Entidades de Dominio

Todas las entidades tienen **comportamiento** (no son anémicas). Encapsulan reglas de negocio y validaciones.

#### User

```typescript
class User {
  readonly id: string;
  readonly email: Email; // Value Object
  readonly name: string;
  readonly password?: Password; // Value Object (null si OAuth)
  readonly role: Role;
  readonly createdAt: Date;

  static create(props: CreateUserProps): User;
  changeRole(newRole: Role): void;
  verifyPassword(plain: string): boolean;
}
```

#### Workspace

```typescript
class Workspace {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly inviteCode: InviteCode; // Value Object
  readonly ownerId: string;
  readonly createdAt: Date;

  static create(props: CreateWorkspaceProps): Workspace;
  regenerateInviteCode(): void;
  isOwner(userId: string): boolean;
}
```

#### Client

```typescript
class Client {
  readonly id: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly age?: number;
  readonly gender?: Gender;
  readonly height?: number;
  readonly activityLevel: ActivityLevel;
  readonly goal: Goal;
  readonly injuries?: string;
  readonly medicalConditions?: string;
  // Gamification
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalWorkouts: number;

  static create(props: CreateClientProps): Client;
  incrementStreak(): void;
  resetStreak(): void;
  incrementTotalWorkouts(): void;
  updateGoal(goal: Goal): void;
  getProgressStrategy(): ProgressCalculatorStrategy; // Strategy Pattern
}
```

#### Workout

```typescript
class Workout {
  readonly id: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly date: Date;
  readonly completed: boolean;
  readonly exercises: Exercise[]; // Value Object array
  readonly duration?: number;
  readonly notes?: string;

  static create(props: CreateWorkoutProps): Workout; // Factory
  markAsCompleted(): void;
  addExercise(exercise: Exercise): void;
  getTotalVolume(): number; // series × reps × peso
}
```

#### Nutrition

```typescript
class Nutrition {
  readonly id: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly date: Date;
  readonly calories?: number;
  readonly water?: number; // ml
  readonly supplements?: string[];
  readonly notes?: string;

  static create(props: CreateNutritionProps): Nutrition;
  isHydrationGoalMet(targetMl: number): boolean;
}
```

#### Biometric

```typescript
class Biometric {
  readonly id: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly date: Date;
  readonly weight?: Weight; // Value Object
  readonly bodyFat?: Percentage; // Value Object
  readonly restingHeartRate?: number;
  readonly bloodPressure?: BloodPressure; // Value Object
  readonly sleepHours?: number;
  readonly notes?: string;

  static create(props: CreateBiometricProps): Biometric;
  isHealthy(): boolean;
  getSleepQuality(): "poor" | "fair" | "good" | "excellent";
}
```

#### Plan

```typescript
class Plan {
  readonly id: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly type: PlanType;
  readonly title: string;
  readonly description?: string;
  readonly content: PlanContent; // Structured JSON
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly generatedByAI: boolean;
  readonly aiPrompt?: string;

  static create(props: CreatePlanProps): Plan;
  isActive(): boolean;
  isExpired(): boolean;
}
```

#### Achievement

```typescript
class Achievement {
  readonly id: string;
  readonly clientId: string;
  readonly type: AchievementType;
  readonly unlockedAt: Date;

  static create(clientId: string, type: AchievementType): Achievement;
}
```

### 5.2 Value Objects

Los Value Objects son **inmutables** y se validan en el constructor.

```typescript
// Email Value Object
class Email {
  readonly value: string;
  constructor(email: string) {
    if (!this.isValid(email)) throw new ValidationException("Invalid email");
    this.value = email.toLowerCase();
  }
  private isValid(email: string): boolean {
    /* regex */
  }
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

// Weight Value Object
class Weight {
  readonly value: number; // kg
  constructor(kg: number) {
    if (kg <= 0 || kg > 500) throw new ValidationException("Invalid weight");
    this.value = kg;
  }
  toImperial(): number {
    return this.value * 2.205;
  }
}

// Percentage Value Object
class Percentage {
  readonly value: number;
  constructor(value: number) {
    if (value < 0 || value > 100)
      throw new ValidationException("Invalid percentage");
    this.value = value;
  }
}

// BloodPressure Value Object
class BloodPressure {
  readonly systolic: number;
  readonly diastolic: number;
  constructor(systolic: number, diastolic: number) {
    /* validación */
  }
  toString(): string {
    return `${this.systolic}/${this.diastolic}`;
  }
  isNormal(): boolean {
    return this.systolic < 120 && this.diastolic < 80;
  }
}

// InviteCode Value Object
class InviteCode {
  readonly value: string;
  static generate(): InviteCode {
    /* uuid */
  }
  isExpired(expirationDays: number, createdAt: Date): boolean {
    /* lógica */
  }
}

// DateRange Value Object
class DateRange {
  readonly start: Date;
  readonly end: Date;
  constructor(start: Date, end: Date) {
    if (start >= end) throw new ValidationException("Invalid date range");
    this.start = start;
    this.end = end;
  }
  includes(date: Date): boolean {
    /* lógica */
  }
  getDays(): number {
    /* cálculo */
  }
}
```

### 5.3 Enums de Dominio

```typescript
enum Role {
  TRAINER = "TRAINER",
  CLIENT = "CLIENT",
}
enum Goal {
  WEIGHT_LOSS,
  MUSCLE_GAIN,
  MAINTENANCE,
  ATHLETIC_PERFORMANCE,
}
enum Gender {
  MALE,
  FEMALE,
  OTHER,
}
enum ActivityLevel {
  SEDENTARY,
  LIGHT,
  MODERATE,
  ACTIVE,
  VERY_ACTIVE,
}
enum PlanType {
  WORKOUT,
  NUTRITION,
}
enum AchievementType {
  STREAK_7,
  STREAK_30,
  WORKOUTS_50,
  WORKOUTS_100,
  WEIGHT_GOAL,
}
```

---

## 6. Design Patterns

### 6.1 Repository Pattern

**Propósito:** Abstraer el acceso a datos detrás de interfaces (Ports). Permite cambiar la implementación de persistencia sin afectar el dominio.

**Dónde:** `domain/repositories/` (interfaces) → `infrastructure/database/repositories/` (implementaciones)

```typescript
// ─── PORT (Domain Layer) ───
// domain/repositories/client.repository.port.ts
export interface ClientRepositoryPort {
  findById(id: string, workspaceId: string): Promise<Client | null>;
  findByUserId(userId: string, workspaceId: string): Promise<Client | null>;
  findAllByWorkspace(workspaceId: string): Promise<Client[]>;
  save(client: Client): Promise<Client>;
  update(client: Client): Promise<Client>;
  delete(id: string, workspaceId: string): Promise<void>;
}

// ─── ADAPTER (Infrastructure Layer) ───
// infrastructure/database/repositories/prisma-client.repository.ts
@Injectable()
export class PrismaClientRepository implements ClientRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, workspaceId: string): Promise<Client | null> {
    const data = await this.prisma.client.findFirst({
      where: { id, workspaceId },
    });
    return data ? ClientMapper.toDomain(data) : null;
  }

  async save(client: Client): Promise<Client> {
    const data = ClientMapper.toPersistence(client);
    const saved = await this.prisma.client.create({ data });
    return ClientMapper.toDomain(saved);
  }
  // ...demás métodos
}
```

**Inyección en NestJS:**

```typescript
// modules/client/client.module.ts
@Module({
  providers: [
    { provide: "ClientRepositoryPort", useClass: PrismaClientRepository },
    CreateClientProfileUseCase,
  ],
})
export class ClientModule {}
```

---

### 6.2 Factory Pattern

**Propósito:** Encapsular la lógica de creación de entidades complejas, asegurando que siempre se creen en un estado válido.

**Dónde:** `domain/factories/`

```typescript
// domain/factories/workout.factory.ts
export class WorkoutFactory {
  static create(data: {
    clientId: string;
    workspaceId: string;
    exercises: CreateExerciseInput[];
    duration?: number;
    notes?: string;
  }): Workout {
    // Validación de negocio durante creación
    if (data.exercises.length === 0) {
      throw new BusinessRuleViolationException(
        "Workout must have at least one exercise",
      );
    }

    const exercises = data.exercises.map(
      (e) => new Exercise(e.name, e.sets, e.reps, e.weight),
    );

    return new Workout({
      id: generateUUID(),
      clientId: data.clientId,
      workspaceId: data.workspaceId,
      exercises,
      duration: data.duration,
      notes: data.notes,
      date: new Date(),
      completed: false,
    });
  }
}

// domain/factories/plan.factory.ts
export class PlanFactory {
  static createFromAI(data: {
    clientId: string;
    workspaceId: string;
    type: PlanType;
    title: string;
    content: PlanContent;
    aiPrompt: string;
  }): Plan {
    return new Plan({
      id: generateUUID(),
      ...data,
      generatedByAI: true,
      startDate: new Date(),
      endDate: addWeeks(new Date(), 4),
      createdAt: new Date(),
    });
  }

  static createManual(data: {
    clientId: string;
    workspaceId: string;
    type: PlanType;
    title: string;
    content: PlanContent;
  }): Plan {
    return new Plan({
      id: generateUUID(),
      ...data,
      generatedByAI: false,
      aiPrompt: undefined,
      startDate: new Date(),
      endDate: addWeeks(new Date(), 4),
      createdAt: new Date(),
    });
  }
}
```

---

### 6.3 Strategy Pattern

**Propósito:** Definir una familia de algoritmos intercambiables para calcular el progreso de un cliente según su objetivo (pérdida de peso, ganancia muscular, mantenimiento, rendimiento atlético).

**Dónde:** `domain/strategies/`

```typescript
// domain/strategies/progress-strategy.interface.ts
export interface ProgressReport {
  trend: "improving" | "stable" | "declining";
  percentage: number;
  summary: string;
  keyMetrics: Record<string, number>;
}

export interface ProgressCalculatorStrategy {
  calculate(biometrics: Biometric[], workouts: Workout[]): ProgressReport;
}

// domain/strategies/weight-loss-progress.strategy.ts
export class WeightLossProgressStrategy implements ProgressCalculatorStrategy {
  calculate(biometrics: Biometric[], workouts: Workout[]): ProgressReport {
    // Prioriza: reducción de peso, reducción de grasa corporal
    const weights = biometrics
      .filter((b) => b.weight)
      .map((b) => b.weight!.value);
    const trend = this.calculateWeightTrend(weights);
    const completionRate = this.getWorkoutCompletionRate(workouts);
    return {
      trend,
      percentage: this.calculateProgress(weights),
      summary: `Weight ${trend === "improving" ? "decreasing" : "stagnant"}. Completion: ${completionRate}%`,
      keyMetrics: {
        weightChange: this.getWeightChange(weights),
        completionRate,
      },
    };
  }
  // ...métodos privados
}

// domain/strategies/muscle-gain-progress.strategy.ts
export class MuscleGainProgressStrategy implements ProgressCalculatorStrategy {
  calculate(biometrics: Biometric[], workouts: Workout[]): ProgressReport {
    // Prioriza: aumento de volumen total, aumento de peso controlado
    // ...
  }
}

// domain/strategies/maintenance-progress.strategy.ts
export class MaintenanceProgressStrategy implements ProgressCalculatorStrategy {
  /* ... */
}

// domain/strategies/athletic-performance-progress.strategy.ts
export class AthleticPerformanceProgressStrategy implements ProgressCalculatorStrategy {
  /* ... */
}

// ─── Uso en servicio de dominio ───
// domain/services/progress-calculator.service.ts
export class ProgressCalculatorService {
  private strategies: Map<Goal, ProgressCalculatorStrategy> = new Map([
    [Goal.WEIGHT_LOSS, new WeightLossProgressStrategy()],
    [Goal.MUSCLE_GAIN, new MuscleGainProgressStrategy()],
    [Goal.MAINTENANCE, new MaintenanceProgressStrategy()],
    [Goal.ATHLETIC_PERFORMANCE, new AthleticPerformanceProgressStrategy()],
  ]);

  calculate(
    goal: Goal,
    biometrics: Biometric[],
    workouts: Workout[],
  ): ProgressReport {
    const strategy = this.strategies.get(goal);
    if (!strategy) throw new DomainException(`No strategy for goal: ${goal}`);
    return strategy.calculate(biometrics, workouts);
  }
}
```

---

### 6.4 Observer Pattern (Domain Events)

**Propósito:** Desacoplar efectos secundarios de la acción principal. Cuando un workout se registra, se actualizan rachas, se verifican logros, y se notifica al entrenador — todo sin acoplar esas responsabilidades al caso de uso principal.

**Dónde:** `domain/events/` + `application/event-handlers/`

**Implementación:** NestJS `@nestjs/event-emitter`

```typescript
// ─── Eventos de Dominio ───
// domain/events/domain-event.base.ts
export abstract class DomainEvent {
  readonly occurredAt: Date;
  constructor() {
    this.occurredAt = new Date();
  }
}

// domain/events/workout-registered.event.ts
export class WorkoutRegisteredEvent extends DomainEvent {
  constructor(
    public readonly clientId: string,
    public readonly workspaceId: string,
    public readonly workoutId: string,
    public readonly completed: boolean,
  ) {
    super();
  }
}

// domain/events/achievement-unlocked.event.ts
export class AchievementUnlockedEvent extends DomainEvent {
  constructor(
    public readonly clientId: string,
    public readonly achievementType: AchievementType,
  ) {
    super();
  }
}

// ─── Emisión del evento en el Use Case ───
// application/use-cases/workout/register-workout.use-case.ts
@Injectable()
export class RegisterWorkoutUseCase {
  constructor(
    @Inject("WorkoutRepositoryPort") private workoutRepo: WorkoutRepositoryPort,
    private eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateWorkoutDto): Promise<WorkoutResponseDto> {
    const workout = WorkoutFactory.create(dto);
    const saved = await this.workoutRepo.save(workout);

    // Emitir evento de dominio
    this.eventEmitter.emit(
      "workout.registered",
      new WorkoutRegisteredEvent(
        dto.clientId,
        dto.workspaceId,
        saved.id,
        saved.completed,
      ),
    );

    return WorkoutMapper.toResponse(saved);
  }
}

// ─── Event Handlers ───
// application/event-handlers/update-streak.handler.ts
@Injectable()
export class UpdateStreakHandler {
  constructor(
    @Inject("ClientRepositoryPort") private clientRepo: ClientRepositoryPort,
    @Inject("WorkoutRepositoryPort") private workoutRepo: WorkoutRepositoryPort,
    private streakCalculator: StreakCalculatorService,
  ) {}

  @OnEvent("workout.registered")
  async handle(event: WorkoutRegisteredEvent): Promise<void> {
    if (!event.completed) return;

    const client = await this.clientRepo.findById(
      event.clientId,
      event.workspaceId,
    );
    if (!client) return;

    const recentWorkouts = await this.workoutRepo.findByClientInDateRange(
      event.clientId,
      event.workspaceId,
      this.streakCalculator.getStreakWindow(),
    );

    const newStreak = this.streakCalculator.calculate(recentWorkouts);
    client.updateStreak(newStreak);
    await this.clientRepo.update(client);
  }
}

// application/event-handlers/check-achievements.handler.ts
@Injectable()
export class CheckAchievementsHandler {
  @OnEvent("workout.registered")
  async handle(event: WorkoutRegisteredEvent): Promise<void> {
    // Verificar si se desbloquearon logros (STREAK_7, WORKOUTS_50, etc.)
  }
}
```

---

### 6.5 Decorator Pattern

**Propósito:** Agregar responsabilidades transversales (logging, caching, timing) a los casos de uso sin modificar su código.

**Dónde:** `application/decorators/`

```typescript
// application/decorators/log-execution.decorator.ts
export function LogExecution(): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const startTime = Date.now();
      console.log(
        `[${className}.${String(propertyKey)}] ▶ Executing with args:`,
        JSON.stringify(args),
      );

      try {
        const result = await originalMethod.apply(this, args);
        const elapsed = Date.now() - startTime;
        console.log(
          `[${className}.${String(propertyKey)}] ✅ Completed in ${elapsed}ms`,
        );
        return result;
      } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(
          `[${className}.${String(propertyKey)}] ❌ Failed after ${elapsed}ms:`,
          error,
        );
        throw error;
      }
    };
    return descriptor;
  };
}

// application/decorators/cache-result.decorator.ts
export function CacheResult(ttlSeconds: number): MethodDecorator {
  const cache = new Map<string, { value: any; expiry: number }>();

  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${String(propertyKey)}_${JSON.stringify(args)}`;
      const cached = cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) return cached.value;

      const result = await originalMethod.apply(this, args);
      cache.set(cacheKey, {
        value: result,
        expiry: Date.now() + ttlSeconds * 1000,
      });
      return result;
    };
    return descriptor;
  };
}

// ─── Uso en un Use Case ───
@Injectable()
export class GetClientDashboardUseCase {
  @LogExecution()
  @CacheResult(60) // Cache por 60 segundos
  async execute(
    clientId: string,
    workspaceId: string,
  ): Promise<ClientDashboardDto> {
    // ...lógica del dashboard
  }
}
```

---

### 6.6 Builder Pattern

**Propósito:** Construir queries complejas de reportes y dashboards paso a paso, con una API fluida.

**Dónde:** `application/builders/`

```typescript
// application/builders/dashboard-query.builder.ts
export interface DashboardData {
  client: ClientProfileDto;
  weightHistory: { date: Date; weight: number }[];
  bodyFatHistory: { date: Date; bodyFat: number }[];
  workoutCompletion: { week: string; completed: number; total: number }[];
  caloriesAverage: number;
  currentStreak: number;
  weeklySummary?: string;
}

export class DashboardQueryBuilder {
  private workspaceId?: string;
  private clientId?: string;
  private dateRange?: DateRange;
  private includeWeightHistory = false;
  private includeBodyFatHistory = false;
  private includeWorkoutCompletion = false;
  private includeCaloriesAverage = false;
  private includeWeeklySummary = false;

  forWorkspace(workspaceId: string): this {
    this.workspaceId = workspaceId;
    return this;
  }

  forClient(clientId: string): this {
    this.clientId = clientId;
    return this;
  }

  withDateRange(range: DateRange): this {
    this.dateRange = range;
    return this;
  }

  withWeightHistory(): this {
    this.includeWeightHistory = true;
    return this;
  }

  withBodyFatHistory(): this {
    this.includeBodyFatHistory = true;
    return this;
  }

  withWorkoutCompletion(): this {
    this.includeWorkoutCompletion = true;
    return this;
  }

  withCaloriesAverage(): this {
    this.includeCaloriesAverage = true;
    return this;
  }

  withWeeklySummary(): this {
    this.includeWeeklySummary = true;
    return this;
  }

  withAllMetrics(): this {
    return this.withWeightHistory()
      .withBodyFatHistory()
      .withWorkoutCompletion()
      .withCaloriesAverage()
      .withWeeklySummary();
  }

  async build(
    clientRepo: ClientRepositoryPort,
    biometricRepo: BiometricRepositoryPort,
    workoutRepo: WorkoutRepositoryPort,
    nutritionRepo: NutritionRepositoryPort,
  ): Promise<DashboardData> {
    // Ejecuta solo las queries necesarias según los flags
    const data: DashboardData = {
      /* construye paso a paso */
    };
    // ...
    return data;
  }
}
```

---

### 6.7 Adapter Pattern

**Propósito:** Integrar servicios externos (IA, email, notificaciones) detrás de interfaces. Permite cambiar de proveedor de IA (OpenAI → Claude → Gemini) sin modificar la lógica de aplicación.

**Dónde:** `application/ports/` (interfaces) → `infrastructure/adapters/` (implementaciones)

```typescript
// ─── PORT (Application Layer) ───
// application/ports/ai-service.port.ts
export interface AIServicePort {
  generateWeeklySummary(data: ClientWeeklyData): Promise<string>;
  generateRecommendations(data: ClientAnalysisData): Promise<Recommendation[]>;
  generateWorkoutPlan(data: WorkoutPlanRequest): Promise<PlanContent>;
  generateNutritionPlan(data: NutritionPlanRequest): Promise<PlanContent>;
}

// ─── ADAPTERS (Infrastructure Layer) ───
// infrastructure/adapters/ai/openai.adapter.ts
@Injectable()
export class OpenAIAdapter implements AIServicePort {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({ apiKey: configService.get("OPENAI_API_KEY") });
  }

  async generateWeeklySummary(data: ClientWeeklyData): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: WEEKLY_SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: this.buildSummaryPrompt(data) },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return response.choices[0].message.content!;
  }

  // ...demás métodos
}

// infrastructure/adapters/ai/mock-ai.adapter.ts (para development/testing)
@Injectable()
export class MockAIAdapter implements AIServicePort {
  async generateWeeklySummary(data: ClientWeeklyData): Promise<string> {
    return `Mock weekly summary for client. Weight trend: stable. Workouts completed: ${data.workoutsCompleted}`;
  }
  // ...
}

// ─── Inyección condicional ───
// modules/ai/ai.module.ts
@Module({
  providers: [
    {
      provide: "AIServicePort",
      useClass:
        process.env.NODE_ENV === "production" ? OpenAIAdapter : MockAIAdapter,
    },
  ],
})
export class AIModule {}
```

---

### 6.8 Chain of Responsibility Pattern

**Propósito:** Construir pipelines de validación donde cada handler valida un aspecto específico y pasa al siguiente. Si falla, se detiene la cadena.

**Dónde:** `application/validators/`

```typescript
// application/validators/validation-handler.base.ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export abstract class ValidationHandler<T> {
  private nextHandler?: ValidationHandler<T>;

  setNext(handler: ValidationHandler<T>): ValidationHandler<T> {
    this.nextHandler = handler;
    return handler;
  }

  async handle(data: T): Promise<ValidationResult> {
    const result = await this.validate(data);
    if (!result.isValid) return result;

    if (this.nextHandler) {
      return this.nextHandler.handle(data);
    }
    return { isValid: true, errors: [] };
  }

  protected abstract validate(data: T): Promise<ValidationResult>;
}

// application/validators/biometric-range-validator.ts
export class BiometricRangeValidator extends ValidationHandler<CreateBiometricDto> {
  protected async validate(
    data: CreateBiometricDto,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    if (data.weight && (data.weight < 20 || data.weight > 300)) {
      errors.push("Weight must be between 20kg and 300kg");
    }
    if (data.bodyFat && (data.bodyFat < 2 || data.bodyFat > 60)) {
      errors.push("Body fat must be between 2% and 60%");
    }
    if (data.sleepHours && (data.sleepHours < 0 || data.sleepHours > 24)) {
      errors.push("Sleep hours must be between 0 and 24");
    }
    return { isValid: errors.length === 0, errors };
  }
}

// application/validators/workout-data-validator.ts
export class WorkoutDataValidator extends ValidationHandler<CreateWorkoutDto> {
  protected async validate(data: CreateWorkoutDto): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!data.exercises || data.exercises.length === 0) {
      errors.push("Workout must have at least one exercise");
    }
    for (const exercise of data.exercises) {
      if (exercise.sets <= 0)
        errors.push(`Exercise "${exercise.name}": sets must be > 0`);
      if (exercise.reps <= 0)
        errors.push(`Exercise "${exercise.name}": reps must be > 0`);
      if (exercise.weight < 0)
        errors.push(`Exercise "${exercise.name}": weight cannot be negative`);
    }
    return { isValid: errors.length === 0, errors };
  }
}

// ─── Uso: Construir la cadena ───
const validator = new BiometricRangeValidator();
validator
  .setNext(new DateNotInFutureValidator())
  .setNext(new ClientExistsValidator(clientRepo));

const result = await validator.handle(biometricDto);
if (!result.isValid) throw new ValidationException(result.errors);
```

---

### 6.9 Resumen de Patterns

| #   | Pattern                     | Propósito                                           | Ubicación                                                        |
| --- | --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **Repository**              | Abstraer acceso a datos tras interfaces             | `domain/repositories/` → `infrastructure/database/repositories/` |
| 2   | **Factory**                 | Crear entidades complejas en estado válido          | `domain/factories/`                                              |
| 3   | **Strategy**                | Algoritmos de progreso intercambiables por objetivo | `domain/strategies/`                                             |
| 4   | **Observer**                | Eventos de dominio desacoplados (rachas, logros)    | `domain/events/` → `application/event-handlers/`                 |
| 5   | **Decorator**               | Cross-cutting concerns (logging, caching)           | `application/decorators/`                                        |
| 6   | **Builder**                 | Construcción paso a paso de queries de dashboard    | `application/builders/`                                          |
| 7   | **Adapter**                 | Integración con servicios externos (IA, email)      | `application/ports/` → `infrastructure/adapters/`                |
| 8   | **Chain of Responsibility** | Pipelines de validación en cadena                   | `application/validators/`                                        |

---

## 7. Modelo de Base de Datos

### 7.1 Diagrama ER (Simplificado)

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Workspace  │────<│ WorkspaceMember   │>────│     User     │
│              │     │ (role: TRAINER/   │     │              │
│  id          │     │  CLIENT)          │     │  id          │
│  name        │     └──────────────────┘     │  email       │
│  slug        │                               │  name        │
│  inviteCode  │                               │  password    │
│  ownerId ────│───────────────────────────────│  role        │
└──────┬───────┘                               └──────┬───────┘
       │                                              │
       │ 1:N                                          │ 1:1
       │                                              │
┌──────┴───────┐          ┌──────────────┐     ┌──────┴───────┐
│   Workout    │          │  Nutrition   │     │    Client    │
│              │          │              │     │              │
│  exercises   │          │  calories    │     │  age, gender │
│  completed   │          │  water       │     │  goal        │
│  duration    │          │  supplements │     │  streak      │
│  clientId    │          │  clientId    │     │  totalWorkouts│
│  workspaceId │          │  workspaceId │     └──────┬───────┘
└──────────────┘          └──────────────┘            │
                                                      │ 1:N
                          ┌──────────────┐     ┌──────┴───────┐
                          │ Achievement  │     │  Biometric   │
                          │              │     │              │
                          │  type        │     │  weight      │
                          │  unlockedAt  │     │  bodyFat     │
                          │  clientId    │     │  heartRate   │
                          └──────────────┘     │  bloodPressure│
                                               │  sleepHours  │
                          ┌──────────────┐     │  clientId    │
                          │    Plan      │     │  workspaceId │
                          │              │     └──────────────┘
                          │  type        │
                          │  title       │
                          │  content     │
                          │  generatedByAI│
                          │  clientId    │
                          │  workspaceId │
                          └──────────────┘
```

### 7.2 Schema Prisma Completo

```prisma
// apps/api/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================
// CORE: Workspace & Users (Multi-tenancy)
// ============================================

enum Role {
  TRAINER
  CLIENT
}

model Workspace {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique
  inviteCode String   @unique @default(uuid())
  ownerId    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  owner      User              @relation("WorkspaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members    WorkspaceMember[]
  clients    Client[]
  workouts   Workout[]
  nutritions Nutrition[]
  biometrics Biometric[]
  plans      Plan[]

  @@index([ownerId])
  @@index([inviteCode])
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  password      String?
  role          Role      @default(CLIENT)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  ownedWorkspaces Workspace[]       @relation("WorkspaceOwner")
  memberships     WorkspaceMember[]
  clientProfile   Client?
  accounts        Account[]
  sessions        Session[]

  @@index([email])
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String
  userId      String
  role        Role
  joinedAt    DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([workspaceId])
  @@index([userId])
}

// ============================================
// CLIENT PROFILE
// ============================================

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ActivityLevel {
  SEDENTARY
  LIGHT
  MODERATE
  ACTIVE
  VERY_ACTIVE
}

enum Goal {
  WEIGHT_LOSS
  MUSCLE_GAIN
  MAINTENANCE
  ATHLETIC_PERFORMANCE
}

model Client {
  id                String        @id @default(uuid())
  userId            String        @unique
  workspaceId       String

  // Personal info
  age               Int?
  gender            Gender?
  height            Float?        // cm
  activityLevel     ActivityLevel @default(MODERATE)
  goal              Goal          @default(MAINTENANCE)

  // Medical
  injuries          String?
  medicalConditions String?

  // Gamification
  currentStreak     Int           @default(0)
  longestStreak     Int           @default(0)
  totalWorkouts     Int           @default(0)

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace         Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workouts          Workout[]
  nutritions        Nutrition[]
  biometrics        Biometric[]
  plans             Plan[]
  achievements      Achievement[]

  @@index([workspaceId])
  @@index([userId])
}

// ============================================
// WORKOUTS
// ============================================

model Workout {
  id          String   @id @default(uuid())
  workspaceId String
  clientId    String

  date        DateTime @default(now())
  completed   Boolean  @default(false)
  notes       String?
  exercises   Json     // Array de { name, sets, reps, weight }
  duration    Int?     // minutos

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([workspaceId, clientId])
  @@index([date])
}

// ============================================
// NUTRITION
// ============================================

model Nutrition {
  id          String   @id @default(uuid())
  workspaceId String
  clientId    String

  date        DateTime @default(now())
  calories    Int?
  water       Int?     // ml
  supplements String?  // JSON array
  notes       String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([workspaceId, clientId])
  @@index([date])
}

// ============================================
// BIOMETRICS
// ============================================

model Biometric {
  id               String   @id @default(uuid())
  workspaceId      String
  clientId         String

  date             DateTime @default(now())
  weight           Float?   // kg
  bodyFat          Float?   // percentage
  restingHeartRate Int?     // bpm
  bloodPressure    String?  // "120/80"
  sleepHours       Float?
  notes            String?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client           Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([workspaceId, clientId])
  @@index([date])
}

// ============================================
// PLANS (AI Generated)
// ============================================

enum PlanType {
  WORKOUT
  NUTRITION
}

model Plan {
  id            String    @id @default(uuid())
  workspaceId   String
  clientId      String

  type          PlanType
  title         String
  description   String?
  content       Json      // Contenido estructurado del plan
  startDate     DateTime?
  endDate       DateTime?
  generatedByAI Boolean   @default(false)
  aiPrompt      String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([workspaceId, clientId])
  @@index([type])
}

// ============================================
// GAMIFICATION
// ============================================

enum AchievementType {
  STREAK_7
  STREAK_30
  WORKOUTS_50
  WORKOUTS_100
  WEIGHT_GOAL
}

model Achievement {
  id         String          @id @default(uuid())
  clientId   String
  type       AchievementType
  unlockedAt DateTime        @default(now())

  client     Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([clientId, type])
  @@index([clientId])
}

// ============================================
// AUTH (NextAuth.js v5)
// ============================================

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 7.3 Multi-tenancy: Row-Level Filtering

Todas las queries se filtran por `workspaceId` automáticamente:

```typescript
// infrastructure/database/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// Todos los repositorios reciben workspaceId como parámetro obligatorio
// El TenantContextMiddleware inyecta el workspaceId en el request
```

---

## 8. API REST — Endpoints

### 8.1 Auth

| Método | Ruta                 | Descripción           | Rol         |
| ------ | -------------------- | --------------------- | ----------- |
| POST   | `/api/auth/register` | Registrar usuario     | Público     |
| POST   | `/api/auth/login`    | Iniciar sesión        | Público     |
| POST   | `/api/auth/logout`   | Cerrar sesión         | Autenticado |
| GET    | `/api/auth/session`  | Obtener sesión actual | Autenticado |

### 8.2 Workspaces

| Método | Ruta                               | Descripción                    | Rol         |
| ------ | ---------------------------------- | ------------------------------ | ----------- |
| POST   | `/api/workspaces`                  | Crear workspace                | TRAINER     |
| GET    | `/api/workspaces`                  | Listar mis workspaces          | Autenticado |
| GET    | `/api/workspaces/:id`              | Detalle de workspace           | Miembro     |
| POST   | `/api/workspaces/:id/invite`       | Regenerar código de invitación | TRAINER     |
| POST   | `/api/workspaces/join/:inviteCode` | Unirse a workspace             | CLIENT      |
| GET    | `/api/workspaces/:id/members`      | Listar miembros                | TRAINER     |

### 8.3 Clients

| Método | Ruta                               | Descripción                   | Rol             |
| ------ | ---------------------------------- | ----------------------------- | --------------- |
| POST   | `/api/workspaces/:wId/clients`     | Crear perfil de cliente       | CLIENT          |
| GET    | `/api/workspaces/:wId/clients`     | Listar clientes del workspace | TRAINER         |
| GET    | `/api/workspaces/:wId/clients/:id` | Obtener perfil del cliente    | Miembro         |
| PUT    | `/api/workspaces/:wId/clients/:id` | Actualizar perfil             | CLIENT (propio) |

### 8.4 Workouts

| Método | Ruta                                         | Descripción               | Rol     |
| ------ | -------------------------------------------- | ------------------------- | ------- |
| POST   | `/api/workspaces/:wId/workouts`              | Registrar workout         | CLIENT  |
| GET    | `/api/workspaces/:wId/workouts`              | Listar workouts (filtros) | Miembro |
| GET    | `/api/workspaces/:wId/workouts/:id`          | Detalle de workout        | Miembro |
| PUT    | `/api/workspaces/:wId/workouts/:id`          | Actualizar workout        | CLIENT  |
| PATCH  | `/api/workspaces/:wId/workouts/:id/complete` | Marcar completado         | CLIENT  |

### 8.5 Nutrition

| Método | Ruta                                 | Descripción         | Rol     |
| ------ | ------------------------------------ | ------------------- | ------- |
| POST   | `/api/workspaces/:wId/nutrition`     | Registrar nutrición | CLIENT  |
| GET    | `/api/workspaces/:wId/nutrition`     | Listar registros    | Miembro |
| GET    | `/api/workspaces/:wId/nutrition/:id` | Detalle             | Miembro |
| PUT    | `/api/workspaces/:wId/nutrition/:id` | Actualizar          | CLIENT  |

### 8.6 Biometrics

| Método | Ruta                                  | Descripción           | Rol     |
| ------ | ------------------------------------- | --------------------- | ------- |
| POST   | `/api/workspaces/:wId/biometrics`     | Registrar biométricos | CLIENT  |
| GET    | `/api/workspaces/:wId/biometrics`     | Listar registros      | Miembro |
| GET    | `/api/workspaces/:wId/biometrics/:id` | Detalle               | Miembro |
| PUT    | `/api/workspaces/:wId/biometrics/:id` | Actualizar            | CLIENT  |

### 8.7 Dashboard

| Método | Ruta                                                | Descripción              | Rol     |
| ------ | --------------------------------------------------- | ------------------------ | ------- |
| GET    | `/api/workspaces/:wId/dashboard/trainer`            | Dashboard del entrenador | TRAINER |
| GET    | `/api/workspaces/:wId/dashboard/client/:clientId`   | Dashboard individual     | Miembro |
| GET    | `/api/workspaces/:wId/dashboard/progress/:clientId` | Reporte de progreso      | Miembro |

### 8.8 Plans

| Método | Ruta                                           | Descripción             | Rol     |
| ------ | ---------------------------------------------- | ----------------------- | ------- |
| POST   | `/api/workspaces/:wId/plans`                   | Asignar plan            | TRAINER |
| GET    | `/api/workspaces/:wId/plans/active/:clientId`  | Plan activo del cliente | Miembro |
| GET    | `/api/workspaces/:wId/plans/history/:clientId` | Historial de planes     | Miembro |
| PUT    | `/api/workspaces/:wId/plans/:id`               | Actualizar plan         | TRAINER |

### 8.9 Gamification

| Método | Ruta                                          | Descripción        | Rol     |
| ------ | --------------------------------------------- | ------------------ | ------- |
| GET    | `/api/workspaces/:wId/achievements/:clientId` | Logros del cliente | Miembro |

### 8.10 AI

| Método | Ruta                                                | Descripción                   | Rol     |
| ------ | --------------------------------------------------- | ----------------------------- | ------- |
| POST   | `/api/workspaces/:wId/ai/weekly-summary/:clientId`  | Generar resumen semanal       | TRAINER |
| POST   | `/api/workspaces/:wId/ai/recommendations/:clientId` | Generar recomendaciones       | TRAINER |
| POST   | `/api/workspaces/:wId/ai/workout-plan/:clientId`    | Generar plan de entrenamiento | TRAINER |
| POST   | `/api/workspaces/:wId/ai/nutrition-plan/:clientId`  | Generar plan de alimentación  | TRAINER |

---

## 9. Frontend — Estructura y Páginas

### 9.1 Estructura del Frontend (apps/web/src)

```
apps/web/src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Tailwind v4 styles
│   │
│   ├── (auth)/                       # Grupo de rutas de autenticación
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx                # Layout centrado
│   │
│   ├── (onboarding)/                 # Onboarding post-registro
│   │   ├── create-workspace/page.tsx # Para entrenadores
│   │   ├── join-workspace/page.tsx   # Para clientes
│   │   └── client-profile/page.tsx   # Setup del perfil del cliente
│   │
│   ├── (dashboard)/                  # Grupo principal autenticado
│   │   ├── layout.tsx                # Layout con sidebar
│   │   │
│   │   ├── trainer/                  # Vistas del entrenador
│   │   │   ├── page.tsx              # Dashboard principal (lista de clientes)
│   │   │   ├── clients/
│   │   │   │   └── [clientId]/
│   │   │   │       ├── page.tsx      # Dashboard individual del cliente
│   │   │   │       ├── workouts/page.tsx
│   │   │   │       ├── nutrition/page.tsx
│   │   │   │       ├── biometrics/page.tsx
│   │   │   │       └── plans/page.tsx
│   │   │   └── settings/page.tsx     # Configuración del workspace
│   │   │
│   │   └── client/                   # Vistas del cliente
│   │       ├── page.tsx              # Dashboard personal
│   │       ├── log/                  # Registro diario
│   │       │   ├── workout/page.tsx
│   │       │   ├── nutrition/page.tsx
│   │       │   └── biometric/page.tsx
│   │       ├── progress/page.tsx     # Mi progreso
│   │       ├── plan/page.tsx         # Mi plan actual
│   │       └── achievements/page.tsx # Mis logros
│   │
│   └── api/                          # API routes de Next.js (auth callbacks)
│       └── auth/[...nextauth]/route.ts
│
├── components/                       # Componentes reutilizables
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── charts/                       # Componentes de gráficas
│   │   ├── weight-chart.tsx
│   │   ├── body-fat-chart.tsx
│   │   ├── workout-completion-chart.tsx
│   │   ├── calories-chart.tsx
│   │   └── progress-sparkline.tsx
│   │
│   ├── dashboard/                    # Componentes de dashboard
│   │   ├── client-card.tsx
│   │   ├── metric-card.tsx
│   │   ├── weekly-summary-card.tsx
│   │   ├── streak-widget.tsx
│   │   └── compliance-widget.tsx
│   │
│   ├── forms/                        # Formularios
│   │   ├── workout-form.tsx
│   │   ├── nutrition-form.tsx
│   │   ├── biometric-form.tsx
│   │   └── client-profile-form.tsx
│   │
│   ├── gamification/                 # Componentes de gamificación
│   │   ├── achievement-badge.tsx
│   │   ├── achievement-unlock-modal.tsx
│   │   ├── streak-display.tsx
│   │   └── progress-ring.tsx
│   │
│   └── layout/                       # Layout components
│       ├── sidebar.tsx
│       ├── header.tsx
│       ├── nav-item.tsx
│       └── user-menu.tsx
│
├── hooks/                            # Custom hooks
│   ├── use-auth.ts
│   ├── use-workspace.ts
│   ├── use-clients.ts
│   ├── use-workouts.ts
│   ├── use-biometrics.ts
│   └── use-dashboard.ts
│
├── lib/                              # Utilidades
│   ├── api-client.ts                 # Fetch wrapper para el backend
│   ├── auth.ts                       # NextAuth config
│   ├── utils.ts                      # Helpers
│   └── validators.ts                 # Schemas Zod
│
├── stores/                           # Estado global (Zustand)
│   ├── workspace.store.ts
│   └── ui.store.ts
│
└── types/                            # Tipos del frontend
    ├── api.ts                        # Response types
    └── forms.ts                      # Form types
```

### 9.2 Páginas Principales

#### Landing Page (`/`)

- Hero section explicando el producto
- Features principales
- CTA para registro

#### Trainer Dashboard (`/trainer`)

- Lista de todos los clientes del workspace
- Tarjetas con métricas rápidas por cliente
- Botón para generar enlace de invitación

#### Client Detail (`/trainer/clients/[clientId]`)

- Gráficas: peso, grasa corporal, adherencia, calorías
- Resumen semanal IA
- Botones para generar planes con IA
- Filtros por rango de fecha

#### Client Dashboard (`/client`)

- Widget de racha actual
- Porcentaje de cumplimiento semanal
- Gráficas de progreso personal
- Accesos rápidos para registro diario
- Logros desbloqueados

#### Daily Log (`/client/log/*`)

- Formulario paso a paso para registrar:
  - Workout: ejercicios, series, reps, peso, completado
  - Nutrición: calorías, agua, suplementos
  - Biométricos: peso, grasa, FC, PA, sueño

---

## 10. Sistema de IA

### 10.1 Funciones de IA en el MVP

#### 1. Resumen Semanal Automático

**Input:** Datos de la semana del cliente (workouts, nutrición, biométricos)
**Output:** Texto con análisis de progreso, cumplimiento y mensaje motivacional

```
Prompt estructura:
- Progreso físico (peso, grasa corporal comparado con semana anterior)
- Cumplimiento de entrenamientos (X/Y completados)
- Calidad de sueño (promedio de horas)
- Consistencia de nutrición
- Mensaje motivacional personalizado
```

#### 2. Recomendaciones Básicas

**Input:** Historial del cliente (últimas 4 semanas)
**Output:** Lista de recomendaciones accionables

```
Tipos de recomendaciones:
- Ajustes por estancamiento de peso (>2 semanas sin cambio)
- Sugerencias ante baja adherencia (<60% de entrenamientos completados)
- Recomendaciones de descanso por mal sueño (<6h promedio)
- Ajustes de nutrición (calorías inconsistentes)
```

#### 3. Generación de Plan de Entrenamiento

**Input:** Perfil del cliente (edad, género, objetivo, nivel, lesiones)
**Output:** Plan estructurado de 4 semanas

```json
{
  "title": "Plan de Entrenamiento - Pérdida de Peso",
  "duration": "4 semanas",
  "frequency": "4 días/semana",
  "days": [
    {
      "day": "Día 1 - Tren Superior",
      "exercises": [
        { "name": "Press de banca", "sets": 4, "reps": 12, "rest": "60s" },
        ...
      ]
    }
  ]
}
```

#### 4. Generación de Plan de Alimentación

**Input:** Perfil del cliente + biométricos + objetivo
**Output:** Plan nutricional semanal estructurado

```json
{
  "title": "Plan Nutricional - Déficit Calórico",
  "dailyCalories": 2000,
  "macros": { "protein": 150, "carbs": 200, "fat": 67 },
  "meals": [
    { "meal": "Desayuno", "options": [...] },
    ...
  ]
}
```

### 10.2 Prompts Estructurados

Los prompts se guardan como templates en `infrastructure/adapters/ai/prompts/`:

```
infrastructure/adapters/ai/prompts/
├── weekly-summary.prompt.ts
├── recommendations.prompt.ts
├── workout-plan.prompt.ts
└── nutrition-plan.prompt.ts
```

### 10.3 Manejo de Errores de IA

- **Rate limiting:** Máximo 10 requests/hora por workspace
- **Timeout:** 30 segundos máximo de espera
- **Fallback:** Si la IA falla, retornar mensaje genérico
- **Auditoría:** Guardar el prompt usado en el campo `aiPrompt` del Plan

---

## 11. Multi-tenancy y Seguridad

### 11.1 Aislamiento por Workspace

```typescript
// presentation/middleware/tenant-context.middleware.ts
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const workspaceId = req.params.wId || req.headers["x-workspace-id"];
    if (workspaceId) {
      req["workspaceId"] = workspaceId;
    }
    next();
  }
}
```

### 11.2 Guards

```typescript
// infrastructure/guards/auth.guard.ts
// Verifica que el usuario esté autenticado (JWT/Session)

// infrastructure/guards/roles.guard.ts
// Verifica que el usuario tenga el rol requerido (TRAINER/CLIENT)

// infrastructure/guards/workspace-membership.guard.ts
// Verifica que el usuario pertenezca al workspace solicitado
```

### 11.3 Estrategia de Seguridad

| Aspecto              | Implementación                               |
| -------------------- | -------------------------------------------- |
| **Autenticación**    | NextAuth.js v5 (JWT sessions)                |
| **Passwords**        | bcrypt (hash + salt)                         |
| **CSRF**             | Protección nativa de NextAuth.js             |
| **SQL Injection**    | Prisma (prepared statements)                 |
| **XSS**              | React escapa automáticamente + sanitización  |
| **Rate Limiting**    | @nestjs/throttler                            |
| **CORS**             | Configurado en NestJS                        |
| **Input Validation** | class-validator (backend) + Zod (frontend)   |
| **Secrets**          | Variables de entorno (.env), nunca en código |
| **Multi-tenancy**    | Todas las queries filtradas por workspaceId  |

---

## 12. Estrategia de Testing

### 12.1 Pirámide de Tests

```
         ┌───────────┐
         │   E2E     │   Playwright (flujos completos)
         │  Tests    │
        ┌┴───────────┴┐
        │ Integration  │   Jest + Supertest (endpoints, repos)
        │   Tests      │
       ┌┴──────────────┴┐
       │   Unit Tests    │   Jest (entities, VOs, services, use cases)
       └────────────────┘
```

### 12.2 Qué Testear por Capa

| Capa               | Qué testear                                                     | Framework                      |
| ------------------ | --------------------------------------------------------------- | ------------------------------ |
| **Domain**         | Entities, Value Objects, Domain Services, Strategies, Factories | Jest                           |
| **Application**    | Use Cases (con mocks de repos), Mappers, Builders, Validators   | Jest                           |
| **Infrastructure** | Repositories (con DB real en Docker), Adapters (con mocks)      | Jest + Supertest               |
| **Presentation**   | Controllers (E2E), Filters, Pipes                               | Jest + Supertest               |
| **Frontend**       | Components, Hooks, Pages                                        | Vitest + React Testing Library |
| **E2E**            | Flujos completos (onboarding, registro, dashboard)              | Playwright                     |

### 12.3 Cobertura Objetivo

- **Unit Tests:** >80%
- **Integration Tests:** Flujos críticos cubiertos
- **E2E Tests:** Happy paths principales

---

## 13. Plan de Implementación por Fases

### Fase 0: Setup Inicial (Semana 1)

**Estado: Parcialmente completado ✅**

- [x] Crear monorepo con Turborepo + pnpm
- [x] Configurar proyecto NestJS en `apps/api`
- [x] Configurar proyecto Next.js en `apps/web`
- [x] Setup Docker Compose para PostgreSQL
- [x] Configurar ESLint + Prettier
- [ ] Configurar Prisma con schema inicial
- [ ] Crear estructura de carpetas según arquitectura hexagonal
- [ ] Setup shared packages (`@repo/types`)
- [ ] Crear `.env.example` con variables necesarias
- [ ] Configurar Husky para pre-commit hooks
- [ ] Configurar CI/CD básico (GitHub Actions)

**Entregables:** Monorepo funcional con BD, estructura hexagonal, Prisma migrado.

---

### Fase 1: Autenticación y Workspaces (Semana 2-3)

**Backend:**

- [ ] Implementar entidades de dominio: `User`, `Workspace`, `WorkspaceMember`
- [ ] Implementar Value Objects: `Email`, `Password`, `InviteCode`
- [ ] Implementar repositorios (ports + adapters Prisma)
- [ ] Casos de uso: `RegisterUser`, `LoginUser`, `CreateWorkspace`, `GenerateInviteLink`, `JoinWorkspace`
- [ ] Guards: `AuthGuard`, `RolesGuard`, `WorkspaceMembershipGuard`
- [ ] Middleware: `TenantContextMiddleware`
- [ ] Controllers: `AuthController`, `WorkspaceController`

**Frontend:**

- [ ] Configurar NextAuth.js v5
- [ ] Páginas: Login, Register
- [ ] Onboarding: Create Workspace (trainer), Join Workspace (client)
- [ ] Layout autenticado con sidebar

**Testing:**

- [ ] Unit tests: entidades, value objects, use cases
- [ ] Integration tests: flujo de registro e invitación

---

### Fase 2: Perfil del Cliente (Semana 4)

**Backend:**

- [ ] Entidad de dominio: `Client`
- [ ] Casos de uso: `CreateClientProfile`, `UpdateClientProfile`, `GetClientProfile`
- [ ] Repository: `ClientRepositoryPort` + `PrismaClientRepository`
- [ ] Controller: `ClientController`

**Frontend:**

- [ ] Formulario de perfil del cliente (onboarding)
- [ ] Página de edición de perfil
- [ ] Vista del trainer: lista de clientes

**Testing:**

- [ ] Unit tests: Client entity, use cases

---

### Fase 3: Registro de Entrenamientos (Semana 5)

**Backend:**

- [ ] Entidad: `Workout` con `Exercise` (Value Object)
- [ ] **Factory Pattern:** `WorkoutFactory`
- [ ] **Observer Pattern:** `WorkoutRegisteredEvent` → `UpdateStreakHandler`
- [ ] Servicio de dominio: `StreakCalculatorService`
- [ ] Casos de uso: `RegisterWorkout`, `GetClientWorkouts`, `MarkWorkoutCompleted`
- [ ] Repository: `WorkoutRepositoryPort` + `PrismaWorkoutRepository`

**Frontend:**

- [ ] Formulario para registrar entrenamiento
- [ ] Lista de entrenamientos
- [ ] Indicador visual de racha

**Testing:**

- [ ] Unit tests: `StreakCalculator`, `WorkoutFactory`, eventos

---

### Fase 4: Nutrición y Biométricos (Semana 6)

**Backend:**

- [ ] Entidades: `Nutrition`, `Biometric`
- [ ] Value Objects: `Weight`, `Percentage`, `BloodPressure`
- [ ] **Chain of Responsibility:** Validadores de datos biométricos
- [ ] **Factory Pattern:** `NutritionFactory`, `BiometricFactory`
- [ ] **Observer Pattern:** `BiometricRecordedEvent`
- [ ] Casos de uso CRUD para ambas entidades
- [ ] Repositories

**Frontend:**

- [ ] Formularios de nutrición y biométricos
- [ ] Vista consolidada del día

**Testing:**

- [ ] Unit tests: Value Objects, validadores, factories

---

### Fase 5: Dashboard del Entrenador (Semana 7)

**Backend:**

- [ ] **Strategy Pattern:** Algoritmos de cálculo de progreso por objetivo
- [ ] **Builder Pattern:** `DashboardQueryBuilder`
- [ ] **Decorator Pattern:** `@LogExecution()`, `@CacheResult()`
- [ ] Servicio de dominio: `ProgressCalculatorService`
- [ ] Casos de uso: `GetTrainerDashboard`, `GetClientDashboard`, `GetProgressReport`
- [ ] Endpoints de dashboard con agregaciones

**Frontend:**

- [ ] Dashboard principal del trainer (lista de clientes con métricas)
- [ ] Dashboard individual del cliente con gráficas (Recharts)
- [ ] Componentes: `WeightChart`, `BodyFatChart`, `WorkoutCompletionChart`, `CaloriesChart`
- [ ] Filtros por rango de fecha

**Testing:**

- [ ] Unit tests: Strategies, Builder, ProgressCalculator
- [ ] Integration tests: Dashboard endpoint

---

### Fase 6: Portal del Cliente (Semana 8)

**Frontend:**

- [ ] Dashboard personal del cliente
- [ ] Widget de racha actual (`StreakDisplay`)
- [ ] Widget de cumplimiento semanal (`ComplianceWidget`)
- [ ] Gráficas de progreso personal
- [ ] Vista de plan activo
- [ ] Navegación mobile-friendly

---

### Fase 7: Gamificación (Semana 9)

**Backend:**

- [ ] Entidad: `Achievement`
- [ ] Servicio de dominio: `AchievementUnlockerService`
- [ ] **Observer Pattern:** `CheckAchievementsHandler` (reacciona a eventos de workout/streak)
- [ ] Casos de uso: `CheckAndUnlockAchievements`, `GetClientAchievements`
- [ ] Repository: `AchievementRepositoryPort`

**Frontend:**

- [ ] Componente: `AchievementBadge`
- [ ] Modal de logro desbloqueado
- [ ] Página de logros
- [ ] Indicadores de progreso hacia logros

**Testing:**

- [ ] Unit tests: lógica de desbloqueo

---

### Fase 8: Integración de IA (Semana 10-11)

**Backend:**

- [ ] **Adapter Pattern:** `AIServicePort` → `OpenAIAdapter` + `MockAIAdapter`
- [ ] Prompts estructurados para cada función
- [ ] Casos de uso: `GenerateWeeklySummary`, `GenerateRecommendations`, `GenerateWorkoutPlan`, `GenerateNutritionPlan`
- [ ] **Factory Pattern:** `PlanFactory.createFromAI()`
- [ ] Rate limiting para endpoints de IA
- [ ] Manejo de errores y timeouts

**Frontend:**

- [ ] Botones de generación con loading states
- [ ] Vista de resumen semanal generado
- [ ] Vista de plan generado (editable)
- [ ] Manejo de errores de IA

**Testing:**

- [ ] Unit tests con MockAIAdapter
- [ ] Integration tests opcionales con provider real

---

### Fase 9: Planes y Asignaciones (Semana 12)

**Backend:**

- [ ] Casos de uso: `AssignPlan`, `UpdatePlan`, `GetActivePlan`, `GetPlanHistory`
- [ ] Repository: `PlanRepositoryPort`

**Frontend:**

- [ ] Editor de planes (trainer)
- [ ] Vista de plan asignado (cliente)
- [ ] Historial de planes

---

### Fase 10: Optimización y Testing Final (Semana 13-14)

**Backend:**

- [ ] Optimizar queries de agregación
- [ ] Implementar pagination en listados
- [ ] Rate limiting en endpoints sensibles
- [ ] Auditoría de seguridad
- [ ] Aumentar cobertura de tests >80%

**Frontend:**

- [ ] Optimización de re-renders
- [ ] Skeleton loaders
- [ ] Lazy loading de componentes
- [ ] Responsive design (mobile-first)
- [ ] E2E tests con Playwright

---

### Fase 11: Deployment (Semana 15)

**DevOps:**

- [ ] Configurar entornos (dev, staging, prod)
- [ ] Deploy backend: Railway/Render
- [ ] Deploy frontend: Vercel
- [ ] PostgreSQL en producción
- [ ] Variables de entorno en producción
- [ ] SSL/TLS
- [ ] Backups automáticos
- [ ] Monitoreo: Sentry, logs estructurados

---

## 14. DevOps y Deployment

### 14.1 Entornos

| Entorno         | Backend        | Frontend       | Base de Datos       |
| --------------- | -------------- | -------------- | ------------------- |
| **Development** | localhost:4000 | localhost:3000 | Docker local (5433) |
| **Staging**     | Railway/Render | Vercel Preview | PostgreSQL cloud    |
| **Production**  | Railway/Render | Vercel         | PostgreSQL cloud    |

### 14.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint: ...
  test: ...
  build: ...
  e2e: ...
```

### 14.3 Variables de Entorno

```env
# .env.example
DATABASE_URL=postgresql://postgres:password@localhost:5433/fitness_saas
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
API_URL=http://localhost:4000
NODE_ENV=development
```

---

## 15. Métricas de Éxito

### Técnicas

- Tiempo de respuesta API < 200ms (p95)
- Uptime > 99%
- Cobertura de tests > 80%
- Lighthouse score > 90
- Zero critical security vulnerabilities

### Producto

- Tiempo de onboarding < 5 minutos
- Tasa de activación de clientes > 70%
- Retención semanal > 60%
- NPS > 8

---

## 16. Futuras Mejoras (Post-MVP)

### Funcionalidades

- Chat en tiempo real (Socket.io/WebSockets)
- App móvil nativa (React Native / Expo)
- Reconocimiento de alimentos por imagen (IA)
- Marketplace de planes/rutinas
- Pagos integrados (Stripe)
- Integración con wearables (Apple Health, Google Fit, Fitbit)
- Comparaciones anónimas entre clientes
- Notificaciones push

### Técnicas

- Microservicios (separar módulo de IA)
- GraphQL o tRPC en lugar de REST
- Event Sourcing para auditoría completa
- CQRS para separar lecturas y escrituras
- Redis para cache y sessions
- Elasticsearch para búsquedas avanzadas
- CDN para assets estáticos
- Horizontal scaling

---

## 📚 Referencias

### Arquitectura

- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture — Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [DDD Patterns — Martin Fowler](https://martinfowler.com/tags/domain%20driven%20design.html)
- [Design Patterns — Gang of Four](https://refactoring.guru/design-patterns)

### Stack

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5](https://authjs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

> **Fecha de creación:** Junio 2025
> **Última actualización:** Fase de planeación
> **Versión:** 2.0 (OPUS)
