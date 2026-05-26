# Credenciales del seed

Datos de prueba generados por `prisma/seed.ts`.

> **Contraseña única para todos los usuarios:** `Password123!`

Ejecutar el seed:

```bash
pnpm db:seed            # desde la raíz del repo
# o
pnpm --filter @repo/database db:seed
```

> ⚠️ El seed **borra todos los datos** existentes antes de insertar.

---

## Entrenadores

| Nombre         | Correo                  | Workspace        | Slug             |
| -------------- | ----------------------- | ---------------- | ---------------- |
| Carlos Ramírez | `carlos@fitpro.com`     | FitPro Studio    | `fitpro-studio`  |
| Laura Gómez    | `laura@powerhouse.com`  | PowerHouse Gym   | `powerhouse-gym` |

## Clientes

| Nombre       | Correo               | Workspace      | Notas                                        |
| ------------ | -------------------- | -------------- | -------------------------------------------- |
| Ana Torres   | `ana@example.com`    | FitPro Studio  | Plan "Hipertrofia Full Body" + 2 registros   |
| Bruno Díaz   | `bruno@example.com`  | FitPro Studio  | Plan "Fuerza 5x5" + 1 registro               |
| Carmen Ruiz  | `carmen@example.com` | FitPro Studio  | Asignación INACTIVA (para probar estados)    |
| Diego Mora   | `diego@example.com`  | PowerHouse Gym | Cliente de otro tenant (aislamiento)         |

---

## Otros datos sembrados

- **Catálogo de ejercicios** (global): 39 ejercicios cubriendo todos los grupos musculares (PECHO, ESPALDA, HOMBROS, BICEPS, TRICEPS, PIERNAS, GLUTEOS, CORE, CUERPO_COMPLETO, OTRO).
- **Planes de entrenamiento** (de Carlos):
  - `Hipertrofia Full Body` — HIPERTROFIA, ACTIVO (4 ejercicios)
  - `Fuerza 5x5` — FUERZA, ACTIVO (3 ejercicios)
  - `Resistencia metabólica` — RESISTENCIA, BORRADOR (2 ejercicios, sin asignar)
- **Invitación pendiente** en FitPro Studio:
  - Correo: `nuevo.cliente@example.com`
  - Token: `seed-invitacion-token-fitpro-001` (válido 7 días desde el seed)
- **Notificaciones**: 3 (2 para Ana, 1 para Bruno).

---

## Login rápido

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"carlos@fitpro.com","contrasena":"Password123!"}'
```
