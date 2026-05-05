# Contexto del proyecto (sin arquitectura técnica)

---

# 1. Qué es el producto

Una plataforma web SaaS para entrenadores personales independientes.

Permite gestionar clientes, hacer seguimiento del progreso físico y generar planes de entrenamiento y nutrición.

---

# 2. El problema que resuelve

Los entrenadores personales independientes hoy:

- gestionan clientes con hojas de cálculo o papel
- no tienen forma centralizada de registrar progreso
- pierden tiempo creando planes desde cero
- no pueden mostrar resultados claros a sus clientes
- no tienen visibilidad del avance real de cada persona

---

# 3. A quién va dirigido

## Usuario principal
Entrenador personal independiente

## Usuario secundario
Cliente del entrenador (acceso limitado a su propia información)

---

# 4. Qué puede hacer el entrenador

- crear y gestionar su workspace
- registrar y administrar sus clientes
- crear planes de entrenamiento personalizados
- crear planes nutricionales personalizados
- asignar planes a clientes
- registrar biometría de sus clientes
- ver el progreso de cada cliente
- generar resúmenes y reportes

---

# 5. Qué puede hacer el cliente

- ver su plan de entrenamiento asignado
- ver su plan nutricional asignado
- registrar sus propios entrenamientos
- registrar su propia alimentación
- ver su progreso biométrico

---

# 6. Modelo de negocio

- SaaS
- el entrenador paga por el acceso
- cada entrenador tiene su propio workspace
- los clientes acceden por invitación del entrenador

---

# 7. Alcance del MVP

## Qué incluye

- gestión de workspace
- gestión de clientes
- planes de entrenamiento
- planes nutricionales
- registro de entrenamientos
- registro de nutrición
- registro de biometría
- visualización de progreso
- resúmenes básicos

## Qué NO incluye

- pagos integrados
- chat en tiempo real
- app móvil nativa
- inteligencia artificial
- gamificación
- analítica avanzada

---

# 8. Misión

Empoderar a entrenadores personales independientes con herramientas digitales que les permitan gestionar su negocio, hacer seguimiento preciso del progreso de sus clientes y ofrecer una experiencia profesional.

---

# 9. Visión

Ser la plataforma de referencia para entrenadores personales independientes en el mercado hispanohablante.

---

# 10. Objetivos estratégicos

- validar el producto con entrenadores reales
- reducir el tiempo que el entrenador dedica a tareas administrativas
- mejorar la adherencia de los clientes a sus planes
- construir una base escalable para crecer
- ofrecer seguimiento biométrico preciso

---

# 11. Entidades principales del negocio

- Trainer (entrenador)
- Client (cliente del entrenador)
- Workspace (espacio de trabajo del entrenador)
- Workout Plan (plan de entrenamiento)
- Nutrition Plan (plan nutricional)
- Workout Log (registro de entrenamiento)
- Nutrition Log (registro de alimentación)
- Biometric Record (registro biométrico)

---

# 12. Relaciones clave

- un entrenador tiene un workspace
- un workspace tiene múltiples clientes
- un cliente tiene planes asignados
- un cliente tiene registros de actividad
- un cliente tiene historial biométrico

---

# 13. Flujo principal del producto

1. el entrenador crea su cuenta y workspace
2. invita a sus clientes
3. crea planes personalizados
4. asigna planes a cada cliente
5. registra o el cliente registra su actividad
6. el entrenador visualiza el progreso
7. genera reportes y resúmenes

---

# 14. Diferenciadores clave

- enfocado en entrenadores independientes (no gimnasios)
- mercado hispanohablante
- simple y funcional desde el día uno
- sin complejidad innecesaria para el usuario

---

# 15. Stack tecnológico (sin arquitectura)

- Backend: TypeScript + NestJS
- Base de datos: PostgreSQL
- ORM: Prisma
- Frontend: SPA (por definir)
- Despliegue: por definir
