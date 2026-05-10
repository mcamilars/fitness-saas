/*
  Warnings:

  - You are about to drop the column `tokenDeInvitacion` on the `clientes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "clientes_tokenDeInvitacion_key";

-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "tokenDeInvitacion";

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

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_espacioDeTrabajoId_fkey" FOREIGN KEY ("espacioDeTrabajoId") REFERENCES "espacios_de_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
