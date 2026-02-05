# Plan de Desarrollo - Plataforma SaaS para Entrenadores Personales

## 📋 Información General del Proyecto

### Descripción
Plataforma web SaaS que permite a entrenadores personales gestionar clientes en workspaces privados, registrar progreso físico, y obtener recomendaciones automáticas mediante IA.

### Stack Tecnológico
- **Frontend:** Next.js 14+ (App Router) + TypeScript
- **Backend:** NestJS + TypeScript
- **ORM:** Prisma
- **Base de datos:** PostgreSQL (Docker)
- **Autenticación:** NextAuth.js v5
- **IA:** Por definir (OpenAI/Anthropic/Google Gemini)
- **Arquitectura:** Hexagonal + Clean Architecture
- **Monorepo:** Turborepo o NX (recomendado)

### Arquitectura del Proyecto
```
fitness-saas/
├── apps/
│   ├── frontend/          # Next.js App
│   └── backend/           # NestJS API
├── packages/
│   ├── shared/            # Tipos compartidos, DTOs
│   ├── ui/                # Componentes UI reutilizables
│   └── config/            # Configuraciones compartidas
├── docker/
│   └── docker-compose.yml # PostgreSQL + Redis (opcional)
└── docs/                  # Documentación
```

---

## 🎯 Objetivos del MVP

### Funcionalidades Core
1. **Gestión de Workspaces Multi-tenant**
   - Cada entrenador tiene su workspace aislado
   - Invitación de clientes mediante enlaces únicos
   - Roles: Entrenador (admin) y Cliente (member)

2. **Dashboard del Entrenador**
   - Vista de todos los clientes en el workspace
   - Dashboard individual por cliente con métricas
   - Gráficas de progreso (peso, grasa corporal, adherencia)

3. **Portal del Cliente**
   - Registro diario de entrenamientos
   - Registro de nutrición (calorías, agua, suplementos)
   - Registro de biométricos (peso, grasa, FC, PA, sueño)
   - Vista de progreso personal

4. **Sistema de IA**
   - Resumen semanal automático
   - Recomendaciones basadas en datos
   - Generación de planes de entrenamiento y alimentación

5. **Gamificación Básica**
   - Rachas de entrenamiento
   - Porcentaje de cumplimiento semanal
   - Logros por constancia (4 semanas)

---

## 🏗️ Arquitectura Hexagonal + Clean Architecture

### Capas de la Aplicación

#### 1. Domain Layer (Núcleo)
**Ubicación:** `apps/backend/src/domain/`

```
domain/
├── entities/              # Entidades de dominio
│   ├── workspace.entity.ts
│   ├── user.entity.ts
│   ├── client.entity.ts
│   ├── workout.entity.ts
│   ├── nutrition.entity.ts
│   ├── biometric.entity.ts
│   └── plan.entity.ts
├── value-objects/         # Objetos de valor
│   ├── email.vo.ts
│   ├── weight.vo.ts
│   └── percentage.vo.ts
├── repositories/          # Interfaces de repositorios (Ports)
│   ├── workspace.repository.ts
│   ├── user.repository.ts
│   ├── client.repository.ts
│   ├── workout.repository.ts
│   └── biometric.repository.ts
├── services/              # Servicios de dominio
│   ├── progress-calculator.service.ts
│   └── streak-calculator.service.ts
└── exceptions/            # Excepciones de dominio
    ├── domain.exception.ts
    └── validation.exception.ts
```

**Principios:**
- Sin dependencias externas
- Lógica de negocio pura
- Entidades con comportamiento (no anémicas)
- Value Objects inmutables

#### 2. Application Layer (Casos de Uso)
**Ubicación:** `apps/backend/src/application/`

```
application/
├── use-cases/
│   ├── workspace/
│   │   ├── create-workspace.use-case.ts
│   │   └── invite-client.use-case.ts
│   ├── client/
│   │   ├── register-workout.use-case.ts
│   │   ├── register-nutrition.use-case.ts
│   │   └── register-biometric.use-case.ts
│   ├── trainer/
│   │   ├── get-client-dashboard.use-case.ts
│   │   └── get-progress-report.use-case.ts
│   └── ai/
│       ├── generate-weekly-summary.use-case.ts
│       ├── generate-recommendations.use-case.ts
│       └── generate-plan.use-case.ts
├── dto/                   # Data Transfer Objects
│   ├── create-workout.dto.ts
│   └── client-dashboard.dto.ts
├── ports/                 # Interfaces para servicios externos
│   ├── ai-service.port.ts
│   ├── notification.port.ts
│   └── email.port.ts
└── mappers/               # Mappers entre capas
    ├── workspace.mapper.ts
    └── client.mapper.ts
```

**Principios:**
- Orquesta la lógica de negocio
- Un caso de uso = una acción del usuario
- Independiente de frameworks
- Usa puertos para servicios externos

#### 3. Infrastructure Layer (Adaptadores)
**Ubicación:** `apps/backend/src/infrastructure/`

```
infrastructure/
├── database/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── repositories/      # Implementaciones de repositorios
│       ├── prisma-workspace.repository.ts
│       ├── prisma-user.repository.ts
│       └── prisma-client.repository.ts
├── adapters/              # Adaptadores externos
│   ├── ai/
│   │   ├── ai-service.adapter.ts
│   │   └── openai.adapter.ts (ejemplo)
│   ├── email/
│   │   └── email-service.adapter.ts
│   └── storage/
│       └── s3.adapter.ts (para futuras fotos)
├── config/                # Configuraciones
│   ├── database.config.ts
│   └── auth.config.ts
└── guards/                # Guards de NestJS
    ├── auth.guard.ts
    └── workspace.guard.ts
```

#### 4. Presentation Layer (API/Controllers)
**Ubicación:** `apps/backend/src/presentation/`

```
presentation/
├── controllers/
│   ├── workspace.controller.ts
│   ├── client.controller.ts
│   ├── trainer.controller.ts
│   ├── workout.controller.ts
│   ├── nutrition.controller.ts
│   ├── biometric.controller.ts
│   └── ai.controller.ts
├── middleware/
│   ├── tenant.middleware.ts
│   └── logger.middleware.ts
└── validators/            # Class-validator DTOs
    ├── create-workout.validator.ts
    └── register-biometric.validator.ts
```

### Módulos de NestJS

```
apps/backend/src/modules/
├── workspace/
│   ├── workspace.module.ts
│   ├── workspace.controller.ts
│   └── workspace.providers.ts
├── client/
│   ├── client.module.ts
│   ├── client.controller.ts
│   └── client.providers.ts
├── trainer/
│   └── trainer.module.ts
├── workout/
│   └── workout.module.ts
├── nutrition/
│   └── nutrition.module.ts
├── biometric/
│   └── biometric.module.ts
└── ai/
    └── ai.module.ts
```

---

## 🗄️ Modelo de Base de Datos (Multi-tenant)

### Esquema Prisma Completo

```prisma
// prisma/schema.prisma

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

model Workspace {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  inviteCode  String   @unique @default(uuid())
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  owner       User     @relation("WorkspaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     WorkspaceMember[]
  clients     Client[]
  workouts    Workout[]
  nutritions  Nutrition[]
  biometrics  Biometric[]
  plans       Plan[]

  @@index([ownerId])
  @@index([inviteCode])
}

enum Role {
  TRAINER
  CLIENT
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  password      String?   // Null si usa OAuth
  role          Role      @default(CLIENT)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  ownedWorkspaces  Workspace[] @relation("WorkspaceOwner")
  memberships      WorkspaceMember[]
  clientProfile    Client?
  accounts         Account[]
  sessions         Session[]

  @@index([email])
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String
  userId      String
  role        Role
  joinedAt    DateTime @default(now())

  // Relations
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

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
  id              String        @id @default(uuid())
  userId          String        @unique
  workspaceId     String
  
  // Personal info
  age             Int?
  gender          Gender?
  height          Float?        // cm
  activityLevel   ActivityLevel @default(MODERATE)
  goal            Goal          @default(MAINTENANCE)
  
  // Medical
  injuries        String?       // JSON array o text
  medicalConditions String?
  
  // Gamification
  currentStreak   Int           @default(0)
  longestStreak   Int           @default(0)
  totalWorkouts   Int           @default(0)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace       Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  workouts        Workout[]
  nutritions      Nutrition[]
  biometrics      Biometric[]
  plans           Plan[]
  achievements    Achievement[]

  @@index([workspaceId])
  @@index([userId])
}

// ============================================
// WORKOUTS
// ============================================

model Workout {
  id            String    @id @default(uuid())
  workspaceId   String
  clientId      String
  
  date          DateTime  @default(now())
  completed     Boolean   @default(false)
  notes         String?
  
  // Workout data
  exercises     Json      // Array de ejercicios con series, reps, peso
  duration      Int?      // minutos
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([workspaceId, clientId])
  @@index([date])
}

// ============================================
// NUTRITION
// ============================================

model Nutrition {
  id            String    @id @default(uuid())
  workspaceId   String
  clientId      String
  
  date          DateTime  @default(now())
  
  // Simplified nutrition tracking
  calories      Int?
  water         Int?      // ml
  supplements   String?   // JSON array o text
  notes         String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client        Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([workspaceId, clientId])
  @@index([date])
}

// ============================================
// BIOMETRICS
// ============================================

model Biometric {
  id              String    @id @default(uuid())
  workspaceId     String
  clientId        String
  
  date            DateTime  @default(now())
  
  // Body metrics
  weight          Float?    // kg
  bodyFat         Float?    // percentage
  muscleMass      Float?    // kg (futuro)
  
  // Health metrics
  restingHeartRate Int?     // bpm
  bloodPressure   String?   // "120/80"
  sleepHours      Float?
  
  notes           String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client          Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

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
  aiPrompt      String?   // Para auditoría
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
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
  id            String          @id @default(uuid())
  clientId      String
  
  type          AchievementType
  unlockedAt    DateTime        @default(now())
  
  // Relations
  client        Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)

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
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Políticas de Multi-tenancy

**Row-Level Security (mediante middleware):**
```typescript
// Todos los queries deben filtrar por workspaceId
prisma.client.findMany({
  where: {
    workspaceId: currentWorkspaceId, // Inyectado automáticamente
    // ... otros filtros
  }
})
```

**Workspace Guard:**
```typescript
// apps/backend/src/infrastructure/guards/workspace.guard.ts
// Valida que el usuario pertenece al workspace solicitado
```

---

## 🎨 Design Patterns a Implementar

### 1. Repository Pattern
**Propósito:** Abstraer acceso a datos
**Ubicación:** `domain/repositories/` (interfaces) + `infrastructure/database/repositories/` (implementaciones)

```typescript
// domain/repositories/client.repository.ts
export interface ClientRepository {
  findById(id: string, workspaceId: string): Promise<Client>;
  findByWorkspace(workspaceId: string): Promise<Client[]>;
  save(client: Client): Promise<Client>;
  delete(id: string, workspaceId: string): Promise<void>;
}

// infrastructure/database/repositories/prisma-client.repository.ts
@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private prisma: PrismaService) {}
  
  async findById(id: string, workspaceId: string): Promise<Client> {
    const data = await this.prisma.client.findFirst({
      where: { id, workspaceId }
    });
    return ClientMapper.toDomain(data);
  }
  // ...
}
```

### 2. Factory Pattern
**Propósito:** Crear entidades complejas
**Ubicación:** `domain/factories/`

```typescript
// domain/factories/workout.factory.ts
export class WorkoutFactory {
  static create(data: CreateWorkoutDTO): Workout {
    return new Workout({
      id: generateId(),
      clientId: data.clientId,
      exercises: this.buildExercises(data.exercises),
      date: new Date(),
      completed: false
    });
  }
}
```

### 3. Strategy Pattern
**Propósito:** Diferentes algoritmos de cálculo de progreso
**Ubicación:** `domain/services/strategies/`

```typescript
// domain/services/strategies/progress-calculator.strategy.ts
export interface ProgressCalculatorStrategy {
  calculate(biometrics: Biometric[]): ProgressReport;
}

export class WeightLossProgressStrategy implements ProgressCalculatorStrategy {
  calculate(biometrics: Biometric[]): ProgressReport {
    // Lógica específica para pérdida de peso
  }
}

export class MuscleGainProgressStrategy implements ProgressCalculatorStrategy {
  calculate(biometrics: Biometric[]): ProgressReport {
    // Lógica específica para ganancia muscular
  }
}
```

### 4. Decorator Pattern
**Propósito:** Agregar funcionalidades a casos de uso (logging, caché, etc.)
**Ubicación:** `application/decorators/`

```typescript
// application/decorators/logging.decorator.ts
export function LogExecution() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      console.log(`Executing ${propertyKey}`, args);
      const result = await originalMethod.apply(this, args);
      console.log(`Completed ${propertyKey}`, result);
      return result;
    };
  };
}
```

### 5. Observer Pattern
**Propósito:** Notificaciones y eventos de dominio
**Ubicación:** `domain/events/`

```typescript
// domain/events/client-registered-workout.event.ts
export class ClientRegisteredWorkoutEvent {
  constructor(
    public readonly clientId: string,
    public readonly workoutId: string,
    public readonly date: Date
  ) {}
}

// application/event-handlers/update-streak.handler.ts
@Injectable()
export class UpdateStreakHandler {
  @OnEvent('client.workout.registered')
  async handle(event: ClientRegisteredWorkoutEvent) {
    // Actualizar racha del cliente
  }
}
```

### 6. Builder Pattern
**Propósito:** Construir queries complejas de reportes
**Ubicación:** `application/builders/`

```typescript
// application/builders/dashboard-query.builder.ts
export class DashboardQueryBuilder {
  private workspaceId: string;
  private clientId: string;
  private dateRange: DateRange;
  
  setWorkspace(id: string): this {
    this.workspaceId = id;
    return this;
  }
  
  setClient(id: string): this {
    this.clientId = id;
    return this;
  }
  
  setDateRange(range: DateRange): this {
    this.dateRange = range;
    return this;
  }
  
  async build(): Promise<DashboardData> {
    // Construye la query completa
  }
}
```

### 7. Adapter Pattern
**Propósito:** Integrar servicios externos (IA, email, etc.)
**Ubicación:** `infrastructure/adapters/`

```typescript
// application/ports/ai-service.port.ts
export interface AIServicePort {
  generateWeeklySummary(data: ClientWeekData): Promise<string>;
  generateRecommendations(data: ClientData): Promise<string[]>;
  generatePlan(data: PlanRequest): Promise<PlanContent>;
}

// infrastructure/adapters/ai/openai.adapter.ts
@Injectable()
export class OpenAIAdapter implements AIServicePort {
  async generateWeeklySummary(data: ClientWeekData): Promise<string> {
    // Implementación específica de OpenAI
  }
}

// infrastructure/adapters/ai/claude.adapter.ts
@Injectable()
export class ClaudeAdapter implements AIServicePort {
  async generateWeeklySummary(data: ClientWeekData): Promise<string> {
    // Implementación específica de Claude
  }
}
```

### 8. Chain of Responsibility Pattern
**Propósito:** Validaciones en cadena
**Ubicación:** `application/validators/`

```typescript
// application/validators/chain/
export abstract class ValidationHandler {
  private nextHandler: ValidationHandler;
  
  setNext(handler: ValidationHandler): ValidationHandler {
    this.nextHandler = handler;
    return handler;
  }
  
  async handle(data: any): Promise<ValidationResult> {
    const result = await this.validate(data);
    if (!result.isValid) return result;
    
    if (this.nextHandler) {
      return this.nextHandler.handle(data);
    }
    return result;
  }
  
  protected abstract validate(data: any): Promise<ValidationResult>;
}
```

---

## 🚀 Plan de Implementación por Fases

### **Fase 0: Setup Inicial (Semana 1)**

#### Tareas:
- [ ] Crear monorepo con Turborepo o NX
- [ ] Configurar proyecto NestJS en `apps/backend`
- [ ] Configurar proyecto Next.js 14 en `apps/frontend`
- [ ] Setup Docker Compose para PostgreSQL
- [ ] Configurar Prisma con schema inicial
- [ ] Configurar ESLint, Prettier, Husky
- [ ] Setup shared packages (`@repo/types`, `@repo/ui`)
- [ ] Configurar CI/CD básico (GitHub Actions)

#### Entregables:
- Monorepo funcional
- Base de datos PostgreSQL en Docker
- Estructura de carpetas según arquitectura hexagonal
- Scripts de desarrollo configurados

---

### **Fase 1: Autenticación y Workspaces (Semana 2-3)**

#### Backend:
- [ ] Implementar módulo de autenticación con NextAuth.js v5
- [ ] Crear entidades de dominio: `User`, `Workspace`, `WorkspaceMember`
- [ ] Implementar casos de uso:
  - `CreateWorkspace`
  - `InviteClient` (generar invite code)
  - `JoinWorkspace` (mediante invite code)
- [ ] Implementar Workspace Guard y Tenant Middleware
- [ ] Repositorios: `UserRepository`, `WorkspaceRepository`

#### Frontend:
- [ ] Configurar NextAuth.js en Next.js
- [ ] Páginas de autenticación (Login, Register)
- [ ] Página de creación de workspace (onboarding trainer)
- [ ] Página de unirse a workspace (invitación cliente)
- [ ] Componente de selección de workspace (si usuario pertenece a varios)

#### Testing:
- [ ] Unit tests para casos de uso
- [ ] E2E tests para flujo de registro e invitación

---

### **Fase 2: Perfil del Cliente y Datos Básicos (Semana 4)**

#### Backend:
- [ ] Entidad de dominio: `Client`
- [ ] Casos de uso:
  - `CreateClientProfile`
  - `UpdateClientProfile`
  - `GetClientProfile`
- [ ] Repositorio: `ClientRepository`
- [ ] Endpoints REST para gestión de perfil

#### Frontend:
- [ ] Formulario de perfil del cliente (onboarding)
- [ ] Página de edición de perfil
- [ ] Vista del trainer para ver perfiles de clientes

---

### **Fase 3: Registro de Entrenamientos (Semana 5)**

#### Backend:
- [ ] Entidad de dominio: `Workout`
- [ ] Casos de uso:
  - `RegisterWorkout`
  - `GetClientWorkouts`
  - `UpdateWorkout`
  - `MarkWorkoutAsCompleted`
- [ ] Servicio de dominio: `StreakCalculator`
- [ ] Evento: `ClientRegisteredWorkoutEvent`
- [ ] Event Handler: `UpdateStreakHandler`
- [ ] Repositorio: `WorkoutRepository`

#### Frontend:
- [ ] Formulario para registrar entrenamiento (cliente)
- [ ] Lista de entrenamientos del cliente
- [ ] Vista de entrenamientos para el trainer
- [ ] Indicador visual de racha actual

#### Testing:
- [ ] Unit tests para `StreakCalculator`
- [ ] Integration tests para eventos de dominio

---

### **Fase 4: Registro de Nutrición y Biométricos (Semana 6)**

#### Backend:
- [ ] Entidades: `Nutrition`, `Biometric`
- [ ] Casos de uso:
  - `RegisterNutrition`
  - `RegisterBiometric`
  - `GetClientNutrition`
  - `GetClientBiometrics`
- [ ] Repositorios: `NutritionRepository`, `BiometricRepository`

#### Frontend:
- [ ] Formulario para registrar nutrición diaria
- [ ] Formulario para registrar biométricos
- [ ] Vista consolidada de datos del día (cliente)
- [ ] Timeline de registros

---

### **Fase 5: Dashboard del Entrenador (Semana 7)**

#### Backend:
- [ ] Caso de uso: `GetClientDashboard`
- [ ] Servicio de dominio: `ProgressCalculator`
- [ ] Implementar Strategy Pattern para diferentes tipos de progreso
- [ ] Agregaciones y cálculos de métricas
- [ ] Endpoints para gráficas (peso, grasa, adherencia)

#### Frontend:
- [ ] Dashboard principal del trainer (lista de clientes)
- [ ] Dashboard individual del cliente con:
  - Gráfica de peso en el tiempo
  - Gráfica de % grasa corporal
  - Adherencia de entrenamientos
  - Promedio de calorías
- [ ] Componentes de gráficas con Chart.js o Recharts
- [ ] Filtros por rango de fecha

#### Testing:
- [ ] Unit tests para `ProgressCalculator` y strategies
- [ ] Integration tests para dashboard data

---

### **Fase 6: Portal del Cliente (Semana 8)**

#### Frontend:
- [ ] Dashboard principal del cliente
- [ ] Widget de racha actual
- [ ] Widget de cumplimiento semanal
- [ ] Gráficas de progreso personal (peso, grasa)
- [ ] Vista de plan activo
- [ ] Sección de logros desbloqueados

---

### **Fase 7: Sistema de Gamificación (Semana 9)**

#### Backend:
- [ ] Entidad: `Achievement`
- [ ] Servicio de dominio: `AchievementUnlocker`
- [ ] Casos de uso:
  - `CheckAndUnlockAchievements`
  - `GetClientAchievements`
- [ ] Event Handlers para desbloquear logros automáticamente
- [ ] Repositorio: `AchievementRepository`

#### Frontend:
- [ ] Componente de badge/logro
- [ ] Modal de logro desbloqueado
- [ ] Página de logros del cliente
- [ ] Indicadores de progreso hacia logros

#### Testing:
- [ ] Unit tests para lógica de desbloqueo de logros

---

### **Fase 8: Integración de IA (Semana 10-11)**

#### Backend:
- [ ] Definir Port: `AIServicePort`
- [ ] Implementar Adapter para proveedor de IA elegido
- [ ] Casos de uso:
  - `GenerateWeeklySummary`
  - `GenerateRecommendations`
  - `GenerateWorkoutPlan`
  - `GenerateNutritionPlan`
- [ ] Entidad: `Plan`
- [ ] Repositorio: `PlanRepository`
- [ ] Implementar prompts estructurados para cada tipo de generación
- [ ] Rate limiting y manejo de errores de API

#### Frontend:
- [ ] Botón "Generar resumen semanal" en dashboard trainer
- [ ] Botón "Generar plan de entrenamiento"
- [ ] Botón "Generar plan de alimentación"
- [ ] Vista de plan generado (editable)
- [ ] Loading states y manejo de errores de IA

#### Testing:
- [ ] Mocks del servicio de IA para tests
- [ ] Integration tests con provider real (opcional)

---

### **Fase 9: Planes y Asignaciones (Semana 12)**

#### Backend:
- [ ] Casos de uso:
  - `AssignPlanToClient`
  - `UpdatePlan`
  - `GetActivePlan`
  - `GetPlanHistory`

#### Frontend:
- [ ] Editor de planes (trainer)
- [ ] Vista de plan asignado (cliente)
- [ ] Historial de planes

---

### **Fase 10: Optimizaciones y Testing (Semana 13-14)**

#### Backend:
- [ ] Implementar caché con Redis (opcional)
- [ ] Optimizar queries de agregación
- [ ] Implementar pagination en listados
- [ ] Auditoría de seguridad
- [ ] Rate limiting en endpoints sensibles

#### Frontend:
- [ ] Optimización de re-renders
- [ ] Implementar skeleton loaders
- [ ] Lazy loading de componentes
- [ ] Optimización de bundle size
- [ ] Responsive design para móvil

#### Testing:
- [ ] Aumentar cobertura de tests a >80%
- [ ] E2E tests para flujos completos
- [ ] Performance testing
- [ ] Security testing (OWASP)

---

### **Fase 11: Deployment y Monitoreo (Semana 15)**

#### DevOps:
- [ ] Configurar entornos (dev, staging, prod)
- [ ] Deploy backend en Railway/Render/AWS
- [ ] Deploy frontend en Vercel
- [ ] Setup PostgreSQL en producción
- [ ] Configurar variables de entorno
- [ ] SSL/TLS certificates
- [ ] Backups automáticos de BD

#### Monitoreo:
- [ ] Configurar Sentry para error tracking
- [ ] Logs estructurados (Winston/Pino)
- [ ] Métricas de performance (opcional: Prometheus)
- [ ] Uptime monitoring

---

## 📦 Dependencias Principales

### Backend (NestJS)
```json
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/event-emitter": "^2.0.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "bcrypt": "^5.1.1",
    "next-auth": "^5.0.0-beta"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "supertest": "^6.3.0"
  }
}
```

### Frontend (Next.js)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next-auth": "^5.0.0-beta",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    "recharts": "^2.10.0",
    "tailwindcss": "^3.4.0",
    "shadcn/ui": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@playwright/test": "^1.40.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Shared
```json
{
  "name": "@repo/types",
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

---

## 🧪 Estrategia de Testing

### Unit Tests
- Entidades de dominio
- Value Objects
- Servicios de dominio (ProgressCalculator, StreakCalculator)
- Casos de uso
- Mappers

**Framework:** Jest
**Cobertura objetivo:** >80%

### Integration Tests
- Repositorios con Prisma
- Event handlers
- Adaptadores externos (con mocks)
- Endpoints REST

**Framework:** Jest + Supertest
**Base de datos:** PostgreSQL en Docker (test container)

### E2E Tests
- Flujo completo de onboarding (trainer y cliente)
- Registro de datos y visualización en dashboard
- Generación de planes con IA

**Framework:** Playwright
**Entorno:** Staging

---

## 🔒 Consideraciones de Seguridad

### Multi-tenancy
- Todos los queries filtran por `workspaceId`
- Middleware de tenant valida acceso
- Guards de NestJS verifican permisos por rol

### Autenticación
- NextAuth.js v5 con sessions seguras
- Bcrypt para passwords (si no usa OAuth)
- CSRF protection habilitado
- Rate limiting en login

### Autorización
- RBAC: Trainer vs Client
- Guards personalizados por recurso
- Validación de workspace membership en cada request

### Data Validation
- Class-validator en DTOs
- Zod en frontend y shared
- Sanitización de inputs
- Prepared statements (Prisma protege contra SQL injection)

### Secrets Management
- Variables de entorno (.env)
- Nunca commitear secrets
- Usar secrets manager en producción (AWS Secrets, Railway Secrets)

---

## 📊 Métricas de Éxito del MVP

### Técnicas
- Tiempo de respuesta API < 200ms (p95)
- Uptime > 99%
- Cobertura de tests > 80%
- Lighthouse score > 90

### Producto
- Tiempo de onboarding < 5 minutos
- Tasa de activación de clientes > 70%
- Retención semanal > 60%
- NPS > 8

---

## 🔮 Futuras Mejoras (Post-MVP)

### Funcionalidades
- Chat en tiempo real (Socket.io)
- App móvil nativa (React Native)
- Reconocimiento de alimentos por imagen
- Marketplace de planes/rutinas
- Pagos integrados (Stripe)
- Análisis comparativo entre clientes (anónimo)
- Integración con wearables (Apple Health, Google Fit)

### Técnicas
- Microservicios (separar módulo de IA)
- GraphQL en lugar de REST
- Event Sourcing para auditoría completa
- CQRS para separar lecturas y escrituras
- Elasticsearch para búsquedas avanzadas

---

## 📚 Recursos y Documentación

### Arquitectura
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [DDD Patterns - Martin Fowler](https://martinfowler.com/tags/domain%20driven%20design.html)

### NestJS
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Clean Architecture Example](https://github.com/jmcdo29/testing-nestjs)

### Next.js
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [NextAuth.js v5](https://authjs.dev/)

### Prisma
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Multi-tenancy with Prisma](https://www.prisma.io/docs/guides/database/multi-tenancy)

---

## 🎯 Próximos Pasos Inmediatos

1. **Configurar monorepo** con Turborepo o NX
2. **Inicializar proyectos** (NestJS + Next.js)
3. **Setup Docker Compose** para PostgreSQL
4. **Crear schema.prisma** y ejecutar primera migración
5. **Implementar estructura de carpetas** según arquitectura hexagonal
6. **Comenzar Fase 1:** Autenticación y Workspaces

---

## ✅ Checklist de Inicio

- [ ] Crear repositorio en GitHub
- [ ] Clonar y configurar monorepo
- [ ] Configurar Docker Compose
- [ ] Inicializar Prisma
- [ ] Configurar ESLint + Prettier
- [ ] Setup Husky para pre-commit hooks
- [ ] Crear `.env.example` con variables necesarias
- [ ] Documentar comandos de desarrollo en README.md
- [ ] Configurar GitHub Actions para CI
- [ ] Invitar colaboradores al repo

---

**Fecha de creación:** Febrero 2024
**Última actualización:** Fase de planeación
**Versión:** 1.0
