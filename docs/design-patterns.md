# Patrones de Diseño - Fitness SaaS

Este documento describe los patrones de diseño identificados para el proyecto Fitness SaaS, su función en el contexto del sistema, y el problema específico que resuelven.

---

## Patrones Creacionales

### 1. Factory Method
**Categoría:** Creacional

**Función:** Define una interfaz para crear un objeto, pero deja que las subclases decidan qué clase concretos instanciar.

**Aplicación en Fitness SaaS:**
- `PlanFactory` para crear `PlanDeEntrenamiento` o `PlanDeNutricion` según el tipo requerido
- Interfaz común (`createPlan()`) con lógica de creación específica por tipo de plan

**¿Por qué es útil?**
- Mantiene el código de creación agrupado y testeable
- Evita switch/if para determinar qué tipo de plan crear
- Facilita agregar nuevos tipos de planes sin modificar código existente

---

### 2. Builder
**Categoría:** Creacional

**Función:** Separar la construcción de un objeto complejo de su representación, permitiendo construir diferentes representaciones.

**Aplicación en Fitness SaaS:**
- `RegistroEntrenamientoBuilder` para construir `RegistroDeEntrenamiento`
- Construir paso a paso: primero el registro base (fecha, clienteId), luego agregar `RegistroDeEjercicio` uno a uno
- Permite configuraciones flexibles: con/sin notas, con/sin duracionMin, con/sin pesoKg

**¿Por qué es útil?**
- Construye objetos con muchos campos opcionales de forma legible
- Valida que el objeto esté completo antes de "build"
- Reutilizable para construir distintos tipos de registro

---

### 3. Prototype
**Categoría:** Creacional

**Función:** Crear nuevos objetos copiando instancias existentes sin acoplar a sus clases concretas.

**Aplicación en Fitness SaaS:**
- Clonar `PlanDeEntrenamiento` existente para crear un nuevo plan base
- Copia todos los `EjercicioPlan` asociados sin necesidad de recrear cada ejercicio
- El entrenador selecciona un plan y hace "duplicar" para otro cliente

**¿Por qué es útil?**
- Elimina duplicación de código al crear planes similares
- El cliente recibe una copia independiente del plan original (modificaciones no afectan al original)
- Rápida creación de planes partiendo de plantillas

---

### 4. Singleton
**Categoría:** Creacional

**Función:** Garantizar que una clase tenga una única instancia y proporcionar un punto de acceso global a ella.

**Aplicación en Fitness SaaS:**
- Configuración global del workspace (`WorkspaceConfig`)
- Cache de ejercicios del catálogo para evitar consultas repetitivas a la DB
- Cliente de Clerk para autenticación (una única instancia)

**¿Por qué es útil?**
- En NestJS los módulos ya son singletons por defecto, se aprovecha este comportamiento
- Evita crear múltiples conexiones a servicios externos
- Mantiene caches centralizados y compartidos entre requests

---

## Patrones Comportamentales

### 5. Observer
**Categoría:** Comportamental

**Función:** Definir una dependencia uno-a-muchos entre objetos, de modo que cuando un objeto cambia de estado, todos sus dependientes son notificados automáticamente.

**Aplicación en Fitness SaaS:**
- Sistema de notificaciones: cuando el entrenador modifica un `PlanDeEntrenamiento`, los clientes asignados reciben notificación
- Registro de observadores: un cliente observa cambios en su plan asignado
- Tipos de notificación: email (vía Mailtrap), in-app notification

**¿Por qué es útil?**
- Desacopla al entrenador (emisor) de los clientes (receptores)
- El cliente elige qué planes observar
- Nuevos tipos de notificación (push, SMS) se agregan sin modificar la lógica del plan

---

### 6. State
**Categoría:** Comportamental

**Función:** Permitir que un objeto altere su comportamiento cuando su estado interno cambia. El objeto parecerá cambiar de clase.

**Aplicación en Fitness SaaS:**
- Ciclo de vida de `PlanDeEntrenamiento`: BORRADOR → ACTIVO → ARCHIVADO
- Ciclo de vida de `Cliente`: invitado → onboarding → activo → inactivo
- Validación de transiciones: solo permite ARCHIVAR desde ACTIVO, no desde BORRADOR

**¿Por qué es útil?**
- Evita estados inválidos (ej. activar un plan ya archivado)
- Cada estado encapsula su propia lógica de transiciones válidas
- Agregar nuevos estados (ej. "EN_REVISION") no requiere modificar código existente

---

### 7. Strategy
**Categoría:** Comportamental

**Función:** Definir una familia de algoritmos, encapsular cada uno, y hacerlos intercambiables. Strategy permite que el algoritmo varíe independientemente del cliente que lo usa.

**Aplicación en Fitness SaaS:**
- Cálculo de progreso del cliente con diferentes estrategias:
  - `ProgresoSemanalStrategy`: resume por semana
  - `ProgresoMensualStrategy`: resume por mes
  - `ProgresoPorPlanStrategy`: resume por plan completado
- El entrenador o cliente selecciona qué estrategia usar al consultar progreso

**¿Por qué es útil?**
- Agregar nueva métrica de progreso sin tocar código existente
- Usuario puede cambiar entre vistas de progreso sin recargar datos
- Cada estrategia es testeable de forma independiente

---

### 8. Command
**Categoría:** Comportamental

**Función:** Encapsular una solicitud como un objeto, permitiendo parametrizar clientes con diferentes solicitudes, colas de solicitudes, y soporte para undo.

**Aplicación en Fitness SaaS:**
- `InvitarClienteCommand`: encapsula lógica de generar token, enviar email, registrar invitación
- `ArchivarPlanCommand`: encapsula cambio de estado + notificación a clientes afectados
- `DesactivarClienteCommand`: soft-delete con backup de estado

**¿Por qué es útil?**
- Logging de todas las acciones para auditoría
- Posibilidad de implementar undo (deshacer invitación, restaurar plan archivado)
- Acciones asíncronas: si el email falla, el command puede reintentarse o hacerse en cola
- Historial de comandos ejecutados por cada entrenador

---

### 9. Memento
**Categoría:** Comportamental

**Función:** Capturar y externalizar el estado interno de un objeto sin violar la encapsulación, para poder restaurar el objeto a ese estado más tarde.

**Aplicación en Fitness SaaS:**
- Antes de un soft-delete de `Cliente`, guardar memento con todos sus datos
- Antes de cambiar workspace de cliente, guardar estado previo
- Permiterestore si el soft-delete fue un error

**¿Por qué es útil?**
- Backup antes de operaciones destructivas o de difícil reversión
- Historial de cambios en el estado del cliente
- Facilita debugging al poder "viajar" a estados anteriores

---

## Patrones Estructurales

### 10. Facade
**Categoría:** Estructural

**Función:** Proporcionar una interfaz unificada para un conjunto de interfaces en un subsistema. Facade define una interfaz de alto nivel que hace que el subsistema sea más fácil de usar.

**Aplicación en Fitness SaaS:**
- `ClienteDashboardFacade`: una llamada retorna perfil + planes asignados + registros recientes + resumen de progreso
- `ReporteFacade`: genera reporte HTML agregándo datos de múltiples tablas
- Oculta la complejidad de joins entre Cliente, PerfilDelCliente, Asignaciones, Registros

**¿Por qué es útil?**
- El frontend hace una sola llamada en lugar de 5+ endpoint para cargar el dashboard
- Cambios internos en cómo se calculan los datos no afectan al consumidor de la API
- Reduce acoplamiento entre capas

---

## Resumen

| Patrón | Categoría | Entidad Principal | Problema que Resuelve |
|--------|-----------|-------------------|----------------------|
| Factory Method | Creacional | PlanDeEntrenamiento / PlanDeNutricion | Crear planes sin switch/if |
| Builder | Creacional | RegistroDeEntrenamiento | Construir registros con campos opcionales |
| Prototype | Creacional | PlanDeEntrenamiento | Clonar planes rápidamente |
| Singleton | Creacional | Configuración global | Una sola instancia de recursos compartidos |
| Observer | Comportamental | Cliente + Plan | Notificar cambios de plan a clientes |
| State | Comportamental | Plan / Cliente | Ciclos de vida con transiciones válidas |
| Strategy | Comportamental | Progreso | Múltiples formas de calcular progreso |
| Command | Comportamental | Acciones varias | Encapsular acciones con undo y logging |
| Memento | Comportamental | Cliente | Backup antes de soft-delete |
| Facade | Estructural | Cliente | Agregar datos del dashboard en una llamada |

---

## Notas de Implementación

- **NestJS ya proporciona estructura** para algunos patrones (módulos como singletons, Guards para Command, etc.)
- **No todos los patrones son necesarios desde el día uno**. Se recomienda implementar en este orden:
  1. MVP: Factory Method, Builder, State, Facade
  2. Post-MVP: Observer, Command, Strategy
  3. Futuros: Prototype, Memento, Singleton
- Los patrones son herramientas, no reglas estrictas. Adaptarlos al contexto del proyecto.
