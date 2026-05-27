"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Dumbbell, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import type { EstadoPlan, PlanDeEntrenamiento, TipoPlan } from "@/lib/types/api";
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

async function fetchPlanes(): Promise<PlanDeEntrenamiento[]> {
  const response = await apiFetch<PlanFromApi[] | { data: PlanFromApi[] }>("/api/planes-entrenamiento");
  return unwrapData(response).map(normalizarPlan);
}

export default function PlanesPage() {
  const router = useRouter();
  const { data: planes, isLoading, isError, refetch } = useQuery({
    queryKey: ["planes"],
    queryFn: fetchPlanes,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes de entrenamiento</h1>
          <p className="text-sm text-slate-500">Gestiona plantillas y estados de tus planes.</p>
        </div>
        <Button onClick={() => router.push("/workspace/planes/nuevo")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      {isLoading ? <PlanesSkeleton /> : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>No se pudieron cargar los planes</CardTitle>
            <CardDescription>Intenta nuevamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : planes?.length === 0 ? (
        <EmptyPlanes onNuevo={() => router.push("/workspace/planes/nuevo")} />
      ) : (
        <Tabs defaultValue="vigentes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vigentes">
              Vigentes ({planes?.filter((plan) => plan.estado !== "ARCHIVADO").length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="archivados">
              Archivados ({planes?.filter((plan) => plan.estado === "ARCHIVADO").length ?? 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vigentes">
            <PlanesGrid
              emptyMessage="No hay planes vigentes. Crea un nuevo plan para comenzar."
              onNuevo={() => router.push("/workspace/planes/nuevo")}
              planes={(planes ?? []).filter((plan) => plan.estado !== "ARCHIVADO")}
            />
          </TabsContent>
          <TabsContent value="archivados">
            <PlanesGrid
              emptyMessage="No hay planes archivados."
              planes={(planes ?? []).filter((plan) => plan.estado === "ARCHIVADO")}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function PlanesGrid({
  planes,
  emptyMessage,
  onNuevo,
}: {
  planes: PlanDeEntrenamiento[];
  emptyMessage: string;
  onNuevo?: () => void;
}) {
  const router = useRouter();

  if (planes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
        <Dumbbell className="mx-auto mb-4 h-10 w-10 text-slate-400" />
        <h3 className="mb-2 text-lg font-medium text-slate-900">Sin planes</h3>
        <p className="mb-6 text-sm text-slate-500">{emptyMessage}</p>
        {onNuevo ? <Button onClick={onNuevo}>Nuevo plan</Button> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {planes.map((plan) => (
        <Card key={plan.id} className="cursor-pointer transition hover:shadow-md" onClick={() => router.push(`/workspace/planes/${plan.id}`)}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg">{plan.nombre}</CardTitle>
              <Badge variant="secondary">{estadoLabels[plan.estado]}</Badge>
            </div>
            <CardDescription>{plan.descripcion || "Sin descripción"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-2">
              <Badge>{tipoLabels[plan.tipo]}</Badge>
              <Badge variant="outline">{plan.ejercicios?.length ?? 0} ejercicios</Badge>
            </div>
            <p>Creado: {plan.creadoEn ? format(new Date(plan.creadoEn), "dd/MM/yyyy") : "—"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyPlanes({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <Dumbbell className="mx-auto mb-4 h-10 w-10 text-slate-400" />
      <h3 className="mb-2 text-lg font-medium text-slate-900">No hay planes aún</h3>
      <p className="mb-6 text-sm text-slate-500">Crea tu primer plan usando el Factory de tipos.</p>
      <Button onClick={onNuevo}>Nuevo plan</Button>
    </div>
  );
}

function PlanesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
