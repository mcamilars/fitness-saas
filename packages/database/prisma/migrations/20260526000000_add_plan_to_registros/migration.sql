-- Relaciona registros históricos con el plan usado como plantilla.
-- No cambia el estado del plan ni de la asignación: el plan puede repetirse indefinidamente.
ALTER TABLE "registros_de_entrenamiento"
ADD COLUMN "planDeEntrenamientoId" TEXT;

ALTER TABLE "registros_de_entrenamiento"
ADD CONSTRAINT "registros_de_entrenamiento_planDeEntrenamientoId_fkey"
FOREIGN KEY ("planDeEntrenamientoId") REFERENCES "planes_de_entrenamiento"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "registros_de_entrenamiento_clienteId_planDeEntrenamientoId_idx"
ON "registros_de_entrenamiento"("clienteId", "planDeEntrenamientoId");
