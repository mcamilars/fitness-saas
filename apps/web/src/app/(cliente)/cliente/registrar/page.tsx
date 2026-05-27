"use client";

import { WizardRegistro } from "@/components/features/registros/wizard-registro";
import { useMiClienteIdResolved } from "@/lib/auth/use-mi-cliente-id-resolved";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegistrarEntrenamientoPage() {
  const { clienteId: miClienteId, isLoading } = useMiClienteIdResolved();

  if (isLoading) {
    return null;
  }

  if (!miClienteId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo identificar tu cliente</CardTitle>
          <CardDescription>Vuelve a iniciar sesión para continuar.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registrar</h1>
        <p className="text-sm text-slate-500">Guarda tu sesión de entrenamiento con un wizard Builder.</p>
      </div>
      <WizardRegistro clienteId={miClienteId} />
    </div>
  );
}
