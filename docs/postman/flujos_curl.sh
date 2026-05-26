#!/usr/bin/env bash
# Comandos curl para probar la API del Fitness SaaS, flujo por flujo.
# Uso: ejecuta los bloques uno por uno (copia/pega) o corre todo el script.
# Requiere: curl y jq. La API debe estar corriendo en localhost:4000.

BASE=http://localhost:4000/api
PW='Password123!'

# ===========================================================================
# FLUJO 0 — Login (obtener tokens). El resto de flujos los reutiliza.
# ===========================================================================
TOKEN_ENT=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d "{\"correo\":\"carlos@fitpro.com\",\"contrasena\":\"$PW\"}" | jq -r .data.token)

TOKEN_CLI=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d "{\"correo\":\"ana@example.com\",\"contrasena\":\"$PW\"}" | jq -r .data.token)

echo "TOKEN_ENT=$TOKEN_ENT"
echo "TOKEN_CLI=$TOKEN_CLI"

# IDs base que usan varios flujos
CLI_ID=$(curl -s $BASE/clientes -H "Authorization: Bearer $TOKEN_ENT" \
  | jq -r '.data.clientes[] | select(.usuario.correo=="ana@example.com").id')
EJ=$(curl -s $BASE/ejercicios -H "Authorization: Bearer $TOKEN_ENT" | jq -r '.data[0].id')
echo "CLI_ID=$CLI_ID  EJ=$EJ"


# ===========================================================================
# FLUJO 1 — Onboarding de entrenador
# ===========================================================================
# 1. Registrar entrenador nuevo
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{
  "correo": "nuevo@gym.com",
  "contrasena": "secreto123",
  "nombre": "Nuevo",
  "apellido": "Coach",
  "nombreWorkspace": "Mi Gym"
}' | jq .

# 2. Registrar con el mismo correo -> 409 Conflict
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{
  "correo": "nuevo@gym.com", "contrasena": "secreto123",
  "nombre": "Nuevo", "apellido": "Coach", "nombreWorkspace": "Otro Gym"
}' | jq .

# 3. Listar clientes del nuevo workspace (vacío)
TOKEN_NUEVO=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"correo":"nuevo@gym.com","contrasena":"secreto123"}' | jq -r .data.token)
curl -s $BASE/clientes -H "Authorization: Bearer $TOKEN_NUEVO" | jq .


# ===========================================================================
# FLUJO 2 — Ciclo de vida de un plan (Factory/State/Builder/Prototype)
# ===========================================================================
# 1. Crear plan (nace en BORRADOR)
PLAN=$(curl -s -X POST $BASE/planes-entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Fuerza total","descripcion":"Plan de prueba","tipo":"FUERZA"}' | jq -r .data.id)
echo "PLAN=$PLAN"

# 2. Agregar un ejercicio (Builder)
curl -s -X POST $BASE/planes-entrenamiento/$PLAN/ejercicios -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" \
  -d "{\"ejercicioId\":\"$EJ\",\"series\":5,\"repeticiones\":5,\"segundosDeDescanso\":120,\"orden\":1}" | jq .data

# 3. Ver el plan con sus ejercicios
curl -s $BASE/planes-entrenamiento/$PLAN -H "Authorization: Bearer $TOKEN_ENT" | jq .data

# 4. Activar (BORRADOR -> ACTIVO)
curl -s -X PATCH $BASE/planes-entrenamiento/$PLAN/activar -H "Authorization: Bearer $TOKEN_ENT" | jq .data.estado

# 5. Duplicar (Prototype) -> nuevo plan en BORRADOR
curl -s -X POST $BASE/planes-entrenamiento/$PLAN/duplicar -H "Authorization: Bearer $TOKEN_ENT" | jq '.data | {id, estado}'

# 6. Archivar (ACTIVO -> ARCHIVADO)
curl -s -X PATCH $BASE/planes-entrenamiento/$PLAN/archivar -H "Authorization: Bearer $TOKEN_ENT" | jq .data.estado

# 7. Intentar reactivar un plan archivado -> 400 (State bloquea la transición)
curl -s -X PATCH $BASE/planes-entrenamiento/$PLAN/activar -H "Authorization: Bearer $TOKEN_ENT" | jq .


# ===========================================================================
# FLUJO 3 — Invitar y registrar cliente (invitación)
# ===========================================================================
# 1. Invitar (envía correo via Mailtrap)
curl -s -X POST $BASE/clientes/invitar -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d '{"correo":"prospecto@example.com"}' | jq .

# 2. Verificar invitación (token del seed, sin auth)
curl -s $BASE/invitaciones/seed-invitacion-token-fitpro-001/verificar | jq .

# 3. Registrar cliente con el token del seed
curl -s -X POST $BASE/auth/cliente/register -H "Content-Type: application/json" -d '{
  "tokenInvitacion": "seed-invitacion-token-fitpro-001",
  "correo": "nuevo.cliente@example.com",
  "contrasena": "clave5678",
  "nombre": "María",
  "apellido": "López"
}' | jq .

# 3b. Error: correo que no coincide con la invitación -> 400
curl -s -X POST $BASE/auth/cliente/register -H "Content-Type: application/json" -d '{
  "tokenInvitacion": "seed-invitacion-token-fitpro-001",
  "correo": "otro@example.com", "contrasena": "clave5678", "nombre": "X", "apellido": "Y"
}' | jq .

# 3c. Error: token inexistente -> 404
curl -s -X POST $BASE/auth/cliente/register -H "Content-Type: application/json" -d '{
  "tokenInvitacion": "no-existe", "correo": "a@b.com", "contrasena": "clave5678", "nombre": "X", "apellido": "Y"
}' | jq .

# 4. Login del cliente recién creado
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"correo":"nuevo.cliente@example.com","contrasena":"clave5678"}' | jq '.data.usuario'


# ===========================================================================
# FLUJO 4 — Asignar plan + Observer (notificaciones)
# Requiere un PLAN ACTIVO. Creamos uno nuevo y lo activamos.
# ===========================================================================
PLAN_A=$(curl -s -X POST $BASE/planes-entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d '{"nombre":"Plan activo demo","tipo":"HIPERTROFIA"}' | jq -r .data.id)
curl -s -X POST $BASE/planes-entrenamiento/$PLAN_A/ejercicios -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d "{\"ejercicioId\":\"$EJ\",\"series\":4,\"repeticiones\":10,\"orden\":1}" >/dev/null
curl -s -X PATCH $BASE/planes-entrenamiento/$PLAN_A/activar -H "Authorization: Bearer $TOKEN_ENT" >/dev/null

# 1. Notificaciones de Ana ANTES
echo "Notif antes: $(curl -s $BASE/notificaciones -H "Authorization: Bearer $TOKEN_CLI" | jq '.data | length')"

# 2. Asignar el plan a Ana (dispara el Observer)
ASG=$(curl -s -X POST $BASE/asignaciones/entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" \
  -d "{\"clienteId\":\"$CLI_ID\",\"planEntrenamientoId\":\"$PLAN_A\"}" | jq -r .data.id)
echo "ASG=$ASG"

# 3. Notificaciones de Ana DESPUÉS (una más)
curl -s $BASE/notificaciones -H "Authorization: Bearer $TOKEN_CLI" | jq '.data'

# 4. Listar asignaciones del cliente
curl -s $BASE/clientes/$CLI_ID/asignaciones -H "Authorization: Bearer $TOKEN_ENT" | jq .data

# 5. Marcar una notificación como leída
NOT_ID=$(curl -s $BASE/notificaciones -H "Authorization: Bearer $TOKEN_CLI" | jq -r '.data[0].id')
curl -s -X PATCH $BASE/notificaciones/$NOT_ID/leer -H "Authorization: Bearer $TOKEN_CLI" | jq .data

# 6. Cambiar estado de la asignación a INACTIVO
curl -s -X PUT $BASE/asignaciones/$ASG -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d '{"estado":"INACTIVO"}' | jq .data.estado

# 7. Asignación inexistente -> 404
curl -s -X PUT $BASE/asignaciones/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN_ENT" -H "Content-Type: application/json" \
  -d '{"estado":"INACTIVO"}' | jq .

# 8. Asignar un plan NO activo -> 400
PLAN_B=$(curl -s -X POST $BASE/planes-entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d '{"nombre":"Plan borrador","tipo":"FUERZA"}' | jq -r .data.id)
curl -s -X POST $BASE/asignaciones/entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" \
  -d "{\"clienteId\":\"$CLI_ID\",\"planEntrenamientoId\":\"$PLAN_B\"}" | jq .


# ===========================================================================
# FLUJO 5 — El cliente registra su entrenamiento (Builder)
# ===========================================================================
# 1. Crear registro con varios ejercicios
REG=$(curl -s -X POST $BASE/clientes/$CLI_ID/registros-entrenamiento -H "Authorization: Bearer $TOKEN_CLI" \
  -H "Content-Type: application/json" -d '{
    "fecha": "2026-05-26",
    "duracionMin": 60,
    "notas": "Sesión de empuje",
    "ejercicios": [
      {"nombre":"Press de banca","grupoMuscular":"PECHO","series":4,"repeticiones":10,"pesoKg":45},
      {"nombre":"Press militar","grupoMuscular":"HOMBROS","series":3,"repeticiones":12,"pesoKg":25}
    ]
  }' | jq -r '.data.registro.id')
echo "REG=$REG"

# 2. Listar registros paginado
curl -s "$BASE/clientes/$CLI_ID/registros-entrenamiento?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN_CLI" | jq '.data | {total, page, limit, n: (.registros|length)}'

# 3. Filtrar por rango de fechas
curl -s "$BASE/clientes/$CLI_ID/registros-entrenamiento?desde=2026-05-01&hasta=2026-05-31" \
  -H "Authorization: Bearer $TOKEN_CLI" | jq '.data.registros | length'


# ===========================================================================
# FLUJO 6 — Reports: progreso (Strategy) y dashboard (Facade)
# ===========================================================================
# 1. Progreso en las 3 vistas
for v in semanal mensual porPlan; do
  echo "--- vista=$v ---"
  curl -s "$BASE/clientes/$CLI_ID/progreso?vista=$v" -H "Authorization: Bearer $TOKEN_CLI" | jq -c .data
done

# 2. Dashboard (solo ENTRENADOR)
curl -s $BASE/clientes/$CLI_ID/dashboard -H "Authorization: Bearer $TOKEN_ENT" | jq .data

# 3. Dashboard con token de cliente -> 403
curl -s -o /dev/null -w "dashboard como cliente: %{http_code}\n" \
  $BASE/clientes/$CLI_ID/dashboard -H "Authorization: Bearer $TOKEN_CLI"


# ===========================================================================
# FLUJO 7 — Soft delete y restauración de cliente (Command)
# Usamos a Bruno para no desactivar a Ana.
# ===========================================================================
BRUNO=$(curl -s $BASE/clientes -H "Authorization: Bearer $TOKEN_ENT" \
  | jq -r '.data.clientes[] | select(.usuario.correo=="bruno@example.com").id')

# 1. Desactivar
curl -s -X DELETE $BASE/clientes/$BRUNO -H "Authorization: Bearer $TOKEN_ENT" | jq .
# 2. Verificar estaActivo=false
curl -s $BASE/clientes/$BRUNO -H "Authorization: Bearer $TOKEN_ENT" | jq '.data.cliente.estaActivo'
# 3. Restaurar
curl -s -X POST $BASE/clientes/$BRUNO/restaurar -H "Authorization: Bearer $TOKEN_ENT" | jq .
# 4. Verificar estaActivo=true
curl -s $BASE/clientes/$BRUNO -H "Authorization: Bearer $TOKEN_ENT" | jq '.data.cliente.estaActivo'


# ===========================================================================
# FLUJO 8 — Seguridad: roles, tenant y autenticación
# ===========================================================================
# Sin token -> 401
curl -s -o /dev/null -w "sin token: %{http_code}\n" $BASE/clientes
# Token inválido -> 401
curl -s -o /dev/null -w "token inválido: %{http_code}\n" $BASE/clientes -H "Authorization: Bearer xxx"
# Cliente accediendo a gestión de clientes -> 403
curl -s -o /dev/null -w "cliente en /clientes: %{http_code}\n" $BASE/clientes -H "Authorization: Bearer $TOKEN_CLI"
# Aislamiento de tenant: Laura (otro workspace) intenta ver el dashboard de Ana
TOKEN_LAURA=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d "{\"correo\":\"laura@powerhouse.com\",\"contrasena\":\"$PW\"}" | jq -r .data.token)
curl -s -o /dev/null -w "cross-tenant: %{http_code}\n" \
  $BASE/clientes/$CLI_ID/dashboard -H "Authorization: Bearer $TOKEN_LAURA"


# ===========================================================================
# FLUJO 9 — Validación de entradas (DTOs) -> 400
# ===========================================================================
# Contraseña corta
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"correo":"x@y.com","contrasena":"123","nombre":"X","apellido":"Y","nombreWorkspace":"Z"}' | jq .mensaje
# Correo inválido
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"correo":"no-es-correo","contrasena":"Password123!"}' | jq .mensaje
# Tipo de plan inválido (enum)
curl -s -X POST $BASE/planes-entrenamiento -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" -d '{"nombre":"Plan X","tipo":"CARDIO"}' | jq .mensaje
# series=0 (mínimo 1)
curl -s -X POST $BASE/planes-entrenamiento/$PLAN_A/ejercicios -H "Authorization: Bearer $TOKEN_ENT" \
  -H "Content-Type: application/json" \
  -d "{\"ejercicioId\":\"$EJ\",\"series\":0,\"repeticiones\":10,\"orden\":1}" | jq .mensaje
