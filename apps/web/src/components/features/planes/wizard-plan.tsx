"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import type { PlanDeEntrenamiento, TipoPlan } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  descripcion: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const tipos: Array<{ tipo: TipoPlan; nombre: string; detalle: string; descanso: string }> = [
  { tipo: "HIPERTROFIA", nombre: "Hipertrofia", detalle: "4 × 10", descanso: "60s descanso" },
  { tipo: "FUERZA", nombre: "Fuerza", detalle: "5 × 5", descanso: "180s descanso" },
  { tipo: "RESISTENCIA", nombre: "Resistencia", detalle: "3 × 15", descanso: "30s descanso" },
];

export function WizardPlan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState<TipoPlan | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", descripcion: "" },
  });

  const crearPlan = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiFetch<PlanDeEntrenamiento | { data: PlanDeEntrenamiento }>("/api/planes-entrenamiento", {
        method: "POST",
        body: JSON.stringify({ ...values, tipo }),
      });
      return unwrapData(response);
    },
    onSuccess: (plan) => {
      toast.success("Plan creado");
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      router.push(`/workspace/planes/${plan.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el plan");
    },
  });

  return (
    <div className="space-y-6">
      {paso === 1 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">1. Elige el tipo de plan</h2>
            <p className="text-sm text-slate-500">El Factory del backend aplicará los defaults del tipo elegido.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {tipos.map((item) => (
              <Card
                key={item.tipo}
                className={`cursor-pointer transition ${tipo === item.tipo ? "border-blue-500 ring-2 ring-blue-100" : "hover:shadow-md"}`}
                onClick={() => setTipo(item.tipo)}
              >
                <CardHeader>
                  <CardTitle>{item.nombre}</CardTitle>
                  <CardDescription>{item.detalle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{item.descanso}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={!tipo} onClick={() => setPaso(2)}>Siguiente</Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => crearPlan.mutate(values))}>
          <div>
            <h2 className="text-xl font-semibold">2. Datos del plan</h2>
            <p className="text-sm text-slate-500">Completa la información básica del plan.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...form.register("nombre")} />
            {form.formState.errors.nombre ? <p className="text-sm text-red-600">{form.formState.errors.nombre.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" {...form.register("descripcion")} />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setPaso(1)}>Atrás</Button>
            <Button type="submit" disabled={crearPlan.isPending}>{crearPlan.isPending ? "Creando..." : "Crear plan"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
