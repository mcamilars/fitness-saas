"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Copy, Archive, Play } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import { toastConUndo } from "@/lib/ui/toast-undo";
import type { EstadoPlan, PlanDeEntrenamiento, TipoPlan } from "@/lib/types/api";
import { TablaEjerciciosPlan } from "@/components/features/planes/tabla-ejercicios-plan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tipoLabels: Record<TipoPlan, string> = {
  HIPERTROFIA: "Hipertrofia",
  FUERZA: "Fuerza",
  RESISTENCIA: "Resistencia",
};

const estadoLabels: Record<EstadoPlan, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  ARCHIVADO: "Archivado",
};

type PlanFromApi = PlanDeEntrenamiento & {
  ejercicioPlanes?: PlanDeEntrenamiento["ejercicios"];
};

function normalizarPlan(plan: PlanFromApi): PlanDeEntrenamiento {
  return {
    ...plan,
    ejercicios: plan.ejercicios ?? plan.ejercicioPlanes ?? [],
  };
}

async function fetchPlan(id: string): Promise<PlanDeEntrenamiento> {
  const response = await apiFetch<PlanFromApi | { data: PlanFromApi }>(`/api/planes-entrenamiento/${id}`);
  return normalizarPlan(unwrapData(response));
}

export default function PlanDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: plan, isLoading, isError, refetch } = useQuery({
    queryKey: ["plan", id],
    queryFn: () => fetchPlan(id),
  });

  const activar = useMutation({
    mutationFn: () => apiFetch(`/api/planes-entrenamiento/${id}/activar`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("Plan activado");
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo activar el plan"),
  });

  const archivar = useMutation({
    mutationFn: () => apiFetch(`/api/planes-entrenamiento/${id}/archivar`, { method: "PATCH" }),
    onSuccess: () => {
      toastConUndo({
        mensaje: "Plan archivado",
        onUndo: async () => {
          await apiFetch("/api/commands/undo", { method: "POST" });
          invalidate();
        },
      });
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo archivar el plan"),
  });

  const duplicar = useMutation({
    mutationFn: async () => {
      const response = await apiFetch<PlanDeEntrenamiento | { data: PlanDeEntrenamiento }>(`/api/planes-entrenamiento/${id}/duplicar`, { method: "POST" });
      return unwrapData(response);
    },
    onSuccess: (nuevoPlan) => {
      toast.success(`Plan duplicado como "${nuevoPlan.nombre}"`);
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      router.push(`/workspace/planes/${nuevoPlan.id}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo duplicar el plan"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["plan", id] });
    queryClient.invalidateQueries({ queryKey: ["planes"] });
  }

  if (isLoading) {
    return <PlanDetalleSkeleton />;
  }

  if (isError || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar el plan</CardTitle>
          <CardDescription>Intenta nuevamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  const sinEjercicios = (plan.ejercicios?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">{plan.nombre}</h1>
          <div className="flex gap-2">
            <Badge>{tipoLabels[plan.tipo]}</Badge>
            <Badge variant="secondary">{estadoLabels[plan.estado]}</Badge>
          </div>
          {plan.descripcion ? <p className="text-sm text-slate-500">{plan.descripcion}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.estado === "BORRADOR" ? (
            <div className="space-y-1">
              <Button disabled={sinEjercicios || activar.isPending} onClick={() => activar.mutate()}>
                <Play className="mr-2 h-4 w-4" />
                Activar
              </Button>
              {sinEjercicios ? <p className="text-xs text-slate-500">Agrega al menos un ejercicio para activar el plan.</p> : null}
            </div>
          ) : null}
          {plan.estado === "ACTIVO" ? (
            <Button disabled={archivar.isPending} variant="outline" onClick={() => archivar.mutate()}>
              <Archive className="mr-2 h-4 w-4" />
              Archivar
            </Button>
          ) : null}
          <Button disabled={duplicar.isPending} variant="outline" onClick={() => duplicar.mutate()}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ejercicios">
        <TabsList>
          <TabsTrigger value="ejercicios">Ejercicios</TabsTrigger>
          <TabsTrigger value="informacion">Información</TabsTrigger>
        </TabsList>
        <TabsContent value="ejercicios" className="mt-4">
          <TablaEjerciciosPlan plan={plan} />
        </TabsContent>
        <TabsContent value="informacion" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
              <CardDescription>Datos generales del plan.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <Info label="Nombre" value={plan.nombre} />
              <Info label="Tipo" value={tipoLabels[plan.tipo]} />
              <Info label="Estado" value={estadoLabels[plan.estado]} />
              <Info label="Descripción" value={plan.descripcion || "—"} />
              <Info label="Creado" value={plan.creadoEn ? format(new Date(plan.creadoEn), "dd/MM/yyyy HH:mm") : "—"} />
              <Info label="Actualizado" value={plan.actualizadoEn ? format(new Date(plan.actualizadoEn), "dd/MM/yyyy HH:mm") : "—"} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-500">{value}</p>
    </div>
  );
}

function PlanDetalleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    </div>
  );
}
