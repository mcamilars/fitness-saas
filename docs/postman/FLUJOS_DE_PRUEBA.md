# Flujos de prueba — Fitness SaaS API

Guía práctica para probar la API a mano (Postman o `curl`). Cada flujo es una secuencia
ordenada de peticiones con su resultado esperado.

- **Base URL:** `http://localhost:4000/api`
- **Colección Postman:** `docs/postman/fitness-saas.postman_collection.json`
- **Credenciales (seed):** contraseña única `Password123!` — ver `packages/database/prisma/SEED_CREDENTIALS.md`
  - Entrenador: `carlos@fitpro.com` (workspace FitPro Studio)
  - Entrenador 2: `laura@powerhouse.com` (workspace PowerHouse Gym)
  - Clientes FitPro: `ana@example.com`, `bruno@example.com`, `carmen@example.com`
  - Cliente PowerHouse: `diego@example.com`

> Si usas Postman, los tokens y los IDs se guardan solos al ejecutar los logins y los listados.
> Si usas `curl`, exporta el token en una variable como se muestra abajo.

---

## Flujo 0 — Preparación (login)

Obtén los dos tokens que usarás en el resto de flujos.

```bash
BASE=http://localhost:4000/api

# Token del entrenador Carlos
TOKEN_ENT=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"correo":"carlos@fitpro.com","contrasena":"Password123!"}' | jq -r .data.token)

# Token de la cliente Ana
TOKEN_CLI=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"correo":"ana@example.com","contrasena":"Password123!"}' | jq -r .data.token)

echo "ENT=$TOKEN_ENT" && echo "CLI=$TOKEN_CLI"
```

**Esperado:** ambos `200 OK` con `{ data: { token, usuario } }`.

---

## Flujo 1 — Onboarding de un entrenador desde cero

Demuestra el registro que crea usuario + workspace en una transacción.

1. **POST `/auth/register`** — registrar entrenador nuevo
   ```json
   { "correo": "nuevo@gym.com", "contrasena": "secreto123", "nombre": "Nuevo", "apellido": "Coach", "nombreWorkspace": "Mi Gym" }
   ```
   → `201` con token. El workspace se crea con un slug único (`mi-gym`).
2. **POST `/auth/register`** otra vez con el mismo correo → `409 Conflict` ("El correo ya está registrado").
3. **GET `/clientes`** con el token recién obtenido → `200` con `{ data: { clientes: [] } }` (workspace vacío).

---

## Flujo 2 — Ciclo de vida de un plan (Factory · State · Builder · Prototype)

Usa `TOKEN_ENT`.

1. **POST `/planes-entrenamiento`** → crea en estado **BORRADOR**
   ```json
   { "nombre": "Fuerza total", "descripcion": "Plan de prueba", "tipo": "FUERZA" }
   ```
   Guarda el `id` como `PLAN`.
2. **GET `/ejercicios`** → copia un `id` de ejercicio (`EJ`).
3. **POST `/planes-entrenamiento/{PLAN}/ejercicios`** → agrega un ejercicio (Builder)
   ```json
   { "ejercicioId": "{EJ}", "series": 5, "repeticiones": 5, "segundosDeDescanso": 120, "orden": 1 }
   ```
4. **PATCH `/planes-entrenamiento/{PLAN}/activar`** → estado pasa a **ACTIVO**.
5. **POST `/planes-entrenamiento/{PLAN}/duplicar`** → clona el plan + ejercicios (Prototype); el duplicado nace en **BORRADOR**.
6. **PATCH `/planes-entrenamiento/{PLAN}/archivar`** → estado **ARCHIVADO**.
7. **PATCH `/planes-entrenamiento/{PLAN}/activar`** otra vez → `400` ("No se puede activar un plan archivado") — el State Pattern bloquea la transición inválida.

```bash
PLAN=$(curl -s -X POST $BASE/planes-entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d '{"nombre":"Fuerza total","tipo":"FUERZA"}' | jq -r .data.id)
EJ=$(curl -s $BASE/ejercicios -H "Authorization: Bearer $TOKEN_ENT" | jq -r '.data[0].id')
curl -s -X POST $BASE/planes-entrenamiento/$PLAN/ejercicios -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d "{\"ejercicioId\":\"$EJ\",\"series\":5,\"repeticiones\":5,\"orden\":1}" | jq .data
curl -s -X PATCH $BASE/planes-entrenamiento/$PLAN/activar -H "Authorization: Bearer $TOKEN_ENT" | jq .data.estado
```

---

## Flujo 3 — Invitar y registrar un cliente (invitación)

1. **POST `/clientes/invitar`** (TOKEN_ENT)
   ```json
   { "correo": "prospecto@example.com" }
   ```
   → `201`. Se crea la invitación y se envía el correo (revisa Mailtrap). Copia el `token` si la respuesta lo devuelve, o usa el del seed.
2. **GET `/invitaciones/{token}/verificar`** (sin auth) → confirma que la invitación es válida.
   - Para probar sin enviar correo, usa el token del seed: `seed-invitacion-token-fitpro-001` (para `nuevo.cliente@example.com`).
3. **POST `/auth/cliente/register`** (sin auth)
   ```json
   { "tokenInvitacion": "seed-invitacion-token-fitpro-001", "correo": "nuevo.cliente@example.com", "contrasena": "clave5678", "nombre": "María", "apellido": "López" }
   ```
   → `201`. Casos de error a probar:
   - correo distinto al de la invitación → `400`
   - token ya consumido → `400`
   - token inexistente → `404`
4. **POST `/auth/login`** con el nuevo cliente → `200`.

---

## Flujo 4 — Asignar plan y disparar el Observer (notificaciones)

1. **GET `/clientes`** (TOKEN_ENT) → copia el `id` de Ana (`CLI_ID`).
2. Asegúrate de tener un plan **ACTIVO** (Flujo 2, pasos 1-4).
3. **GET `/notificaciones`** con `TOKEN_CLI` → anota cuántas tiene Ana.
4. **POST `/asignaciones/entrenamiento`** (TOKEN_ENT)
   ```json
   { "clienteId": "{CLI_ID}", "planEntrenamientoId": "{PLAN}" }
   ```
   → `201`. Guarda el `id` como `ASG`. Internamente el Observer crea una notificación para Ana.
5. **GET `/notificaciones`** (TOKEN_CLI) → ahora tiene **una notificación más**.
6. **PATCH `/notificaciones/{id}/leer`** (TOKEN_CLI) → la marca como leída.
7. **PUT `/asignaciones/{ASG}`** (TOKEN_ENT) `{ "estado": "INACTIVO" }` → cambia el estado.
8. **PUT `/asignaciones/00000000-0000-0000-0000-000000000000`** → `404` ("Asignación no encontrada").

Reglas a verificar:
- Asignar un plan en BORRADOR/ARCHIVADO → `400` ("Solo se pueden asignar planes activos").

---

## Flujo 5 — El cliente registra su entrenamiento (Builder)

Usa `TOKEN_CLI` y el `CLI_ID` de Ana.

1. **POST `/clientes/{CLI_ID}/registros-entrenamiento`**
   ```json
   {
     "fecha": "2026-05-26",
     "duracionMin": 60,
     "notas": "Sesión de empuje",
     "ejercicios": [
       { "nombre": "Press de banca", "grupoMuscular": "PECHO", "series": 4, "repeticiones": 10, "pesoKg": 45 },
       { "nombre": "Press militar", "grupoMuscular": "HOMBROS", "series": 3, "repeticiones": 12, "pesoKg": 25 }
     ]
   }
   ```
   → `201` con `{ data: { registro: { ... ejercicios: [...] } } }`.
2. **GET `/clientes/{CLI_ID}/registros-entrenamiento?page=1&limit=10`** → respuesta paginada `{ data: { registros, total, page, limit } }`.
3. **GET `/clientes/{CLI_ID}/registros-entrenamiento?desde=2026-05-01&hasta=2026-05-31`** → filtrado por rango de fechas.

---

## Flujo 6 — Reports: progreso (Strategy) y dashboard (Facade)

1. **GET `/clientes/{CLI_ID}/progreso?vista=semanal`** (TOKEN_CLI o TOKEN_ENT) → `200` con `{ data: { progreso } }`.
2. Repite con `?vista=mensual` y `?vista=porPlan` → cada vista usa una estrategia distinta (Strategy Pattern).
3. **GET `/clientes/{CLI_ID}/dashboard`** (TOKEN_ENT) → `200` con el resumen agregado (Facade).
4. **GET `/clientes/{CLI_ID}/dashboard`** con `TOKEN_CLI` → `403` (el dashboard es solo para ENTRENADOR).

```bash
CLI_ID=$(curl -s $BASE/clientes -H "Authorization: Bearer $TOKEN_ENT" \
  | jq -r '.data.clientes[] | select(.usuario.correo=="ana@example.com").id')
for v in semanal mensual porPlan; do
  curl -s "$BASE/clientes/$CLI_ID/progreso?vista=$v" -H "Authorization: Bearer $TOKEN_CLI" | jq -c .data
done
curl -s $BASE/clientes/$CLI_ID/dashboard -H "Authorization: Bearer $TOKEN_ENT" | jq .data
```

---

## Flujo 7 — Soft delete y restauración de cliente (Command)

Usa `TOKEN_ENT` y un `CLI_ID`.

1. **DELETE `/clientes/{CLI_ID}`** → desactiva al cliente (Command: acción deshacible).
2. **GET `/clientes/{CLI_ID}`** → `estaActivo: false`.
3. **POST `/clientes/{CLI_ID}/restaurar`** → reactiva.
4. **GET `/clientes/{CLI_ID}`** → `estaActivo: true`.

---

## Flujo 8 — Seguridad: roles, tenant y autenticación

| Prueba | Petición | Esperado |
|---|---|---|
| Sin token | `GET /clientes` sin `Authorization` | `401` |
| Token inválido | `GET /clientes` con `Bearer xxx` | `401` |
| Rol incorrecto | `GET /clientes/{id}/dashboard` con `TOKEN_CLI` | `403` |
| Cliente accede a gestión | `GET /clientes` con `TOKEN_CLI` | `403` (solo ENTRENADOR) |
| Aislamiento de tenant | Login como `laura@powerhouse.com` y `GET /clientes/{CLI_ID_de_ana}/dashboard` | `403` / `404` (otro workspace) |

```bash
curl -s -o /dev/null -w "%{http_code}\n" $BASE/clientes                                    # 401
curl -s -o /dev/null -w "%{http_code}\n" $BASE/clientes -H "Authorization: Bearer xxx"      # 401
curl -s -o /dev/null -w "%{http_code}\n" $BASE/clientes/$CLI_ID/dashboard -H "Authorization: Bearer $TOKEN_CLI"  # 403
```

---

## Flujo 9 — Validación de entradas (DTOs)

Verifica el `ValidationPipe` global (`400` con `mensaje: string[]`).

| Caso | Petición | Esperado |
|---|---|---|
| Contraseña corta | `POST /auth/register` con `"contrasena": "123"` | `400` (mínimo 8) |
| Correo inválido | `POST /auth/login` con `"correo": "no-es-correo"` | `400` |
| Tipo de plan inválido | `POST /planes-entrenamiento` con `"tipo": "CARDIO"` | `400` (enum) |
| Campo extra | cualquier POST con un campo no declarado | se elimina (whitelist) |
| Series en 0 | agregar ejercicio con `"series": 0` | `400` (mínimo 1) |

---

## Orden recomendado para una demo completa

`Flujo 0` → `2` → `4` → `5` → `6` → `7` → `8`. Cubre todos los patrones
(Factory, State, Builder, Prototype, Observer, Strategy, Facade, Command, Decorator de cache,
Singleton del catálogo y Repository) en una sola pasada.
