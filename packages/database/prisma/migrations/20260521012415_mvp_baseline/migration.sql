-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ENTRENADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "EstadoPlan" AS ENUM ('BORRADOR', 'ACTIVO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "EstadoAsignacion" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoPlanEntrenamiento" AS ENUM ('HIPERTROFIA', 'FUERZA', 'RESISTENCIA');

-- CreateEnum
CREATE TYPE "GrupoMuscular" AS ENUM ('PECHO', 'ESPALDA', 'HOMBROS', 'BICEPS', 'TRICEPS', 'PIERNAS', 'GLUTEOS', 'CORE', 'CUERPO_COMPLETO', 'OTRO');

-- CreateTable
CREATE TABLE "espacios_de_trabajo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "espacios_de_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrenadores" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "espacioDeTrabajoId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrenadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "espacioDeTrabajoId" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "consumida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "entrenadorId" TEXT NOT NULL,
    "espacioDeTrabajoId" TEXT NOT NULL,
    "estaActivo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejercicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoMuscular" "GrupoMuscular" NOT NULL,
    "descripcion" TEXT,
    "instrucciones" TEXT,
    "imagenUrl" TEXT,
    "videoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejercicios_planes" (
    "id" TEXT NOT NULL,
    "planDeEntrenamientoId" TEXT NOT NULL,
    "ejercicioId" TEXT NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticiones" INTEGER NOT NULL,
    "segundosDeDescanso" INTEGER,
    "notas" TEXT,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "ejercicios_planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_de_entrenamiento" (
    "id" TEXT NOT NULL,
    "entrenadorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoPlanEntrenamiento" NOT NULL,
    "estado" "EstadoPlan" NOT NULL DEFAULT 'BORRADOR',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_de_planes_de_entrenamiento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "planDeEntrenamientoId" TEXT NOT NULL,
    "estado" "EstadoAsignacion" NOT NULL DEFAULT 'ACTIVO',
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_de_planes_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_de_entrenamiento" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "duracionMin" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_de_entrenamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_de_ejercicios" (
    "id" TEXT NOT NULL,
    "registroDeEntrenamientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupoMuscular" "GrupoMuscular" NOT NULL,
    "series" INTEGER NOT NULL,
    "repeticiones" INTEGER NOT NULL,
    "pesoKg" DOUBLE PRECISION,
    "notas" TEXT,

    CONSTRAINT "registros_de_ejercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "espacios_de_trabajo_slug_key" ON "espacios_de_trabajo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "entrenadores_usuarioId_key" ON "entrenadores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "entrenadores_espacioDeTrabajoId_key" ON "entrenadores"("espacioDeTrabajoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_usuarioId_key" ON "clientes"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "ejercicios_planes_planDeEntrenamientoId_ejercicioId_key" ON "ejercicios_planes"("planDeEntrenamientoId", "ejercicioId");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_de_planes_de_entrenamiento_clienteId_planDeEnt_key" ON "asignaciones_de_planes_de_entrenamiento"("clienteId", "planDeEntrenamientoId");

-- CreateIndex
CREATE INDEX "notificaciones_clienteId_leida_idx" ON "notificaciones"("clienteId", "leida");

-- AddForeignKey
ALTER TABLE "entrenadores" ADD CONSTRAINT "entrenadores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrenadores" ADD CONSTRAINT "entrenadores_espacioDeTrabajoId_fkey" FOREIGN KEY ("espacioDeTrabajoId") REFERENCES "espacios_de_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_espacioDeTrabajoId_fkey" FOREIGN KEY ("espacioDeTrabajoId") REFERENCES "espacios_de_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_entrenadorId_fkey" FOREIGN KEY ("entrenadorId") REFERENCES "entrenadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_espacioDeTrabajoId_fkey" FOREIGN KEY ("espacioDeTrabajoId") REFERENCES "espacios_de_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicios_planes" ADD CONSTRAINT "ejercicios_planes_planDeEntrenamientoId_fkey" FOREIGN KEY ("planDeEntrenamientoId") REFERENCES "planes_de_entrenamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicios_planes" ADD CONSTRAINT "ejercicios_planes_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "ejercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_de_entrenamiento" ADD CONSTRAINT "planes_de_entrenamiento_entrenadorId_fkey" FOREIGN KEY ("entrenadorId") REFERENCES "entrenadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_de_planes_de_entrenamiento" ADD CONSTRAINT "asignaciones_de_planes_de_entrenamiento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_de_planes_de_entrenamiento" ADD CONSTRAINT "asignaciones_de_planes_de_entrenamiento_planDeEntrenamient_fkey" FOREIGN KEY ("planDeEntrenamientoId") REFERENCES "planes_de_entrenamiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_de_entrenamiento" ADD CONSTRAINT "registros_de_entrenamiento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_de_ejercicios" ADD CONSTRAINT "registros_de_ejercicios_registroDeEntrenamientoId_fkey" FOREIGN KEY ("registroDeEntrenamientoId") REFERENCES "registros_de_entrenamiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
