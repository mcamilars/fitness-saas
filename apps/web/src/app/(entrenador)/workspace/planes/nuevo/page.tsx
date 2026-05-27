import { WizardPlan } from "@/components/features/planes/wizard-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NuevoPlanPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo plan</h1>
        <p className="text-sm text-slate-500">Crea un plan usando los tipos predefinidos.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Wizard de creación</CardTitle>
        </CardHeader>
        <CardContent>
          <WizardPlan />
        </CardContent>
      </Card>
    </div>
  );
}
