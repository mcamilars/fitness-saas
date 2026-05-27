"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import { useMiClienteIdResolved } from "@/lib/auth/use-mi-cliente-id-resolved";
import type { AsignacionEntrenamiento, PlanDeEntrenamiento } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PlanFromApi = PlanDeEntrenamiento & { ejercicioPlanes?: PlanDeEntrenamiento["ejercicios"] };

function normalizarPlan(plan: PlanFromApi): PlanDeEntrenamiento {
  return { ...plan, ejercicios: plan.ejercicios ?? plan.ejercicioPlanes ?? [] };
}

async function fetchAsignaciones(clienteId: string) {
  const response = await apiFetch<AsignacionEntrenamiento[] | { data: AsignacionEntrenamiento[] }>(`/api/clientes/${clienteId}/asignaciones`);
  return unwrapData(response);
}

async function fetchPlan(planId: string) {
  const response = await apiFetch<PlanFromApi | { data: PlanFromApi }>(`/api/planes-entrenamiento/${planId}`);
  return normalizarPlan(unwrapData(response));
}

export default function MiPlanPage() {
  const { clienteId: miClienteId, isLoading: loadingCliente } = useMiClienteIdResolved();

  const { data: asignaciones = [], isLoading: loadingAsignaciones } = useQuery({
    queryKey: ["mi-plan", miClienteId, "asignaciones"],
    queryFn: () => fetchAsignaciones(miClienteId!),
    enabled: !!miClienteId,
  });

  const asignacionesConPlanId = asignaciones
    .map((asignacion) => ({
      asignacion,
      planId: asignacion.planEntrenamientoId ?? asignacion.planDeEntrenamientoId,
    }))
    .filter((item): item is { asignacion: AsignacionEntrenamiento; planId: string } => !!item.planId);

  const { data: planes = [], isLoading: loadingPlanes } = useQuery({
    queryKey: ["mis-planes", miClienteId, asignacionesConPlanId.map((item) => item.planId).join(",")],
    queryFn: async () => Promise.all(asignacionesConPlanId.map((item) => fetchPlan(item.planId))),
    enabled: asignacionesConPlanId.length > 0,
  });

  if (loadingCliente || !miClienteId || loadingAsignaciones || loadingPlanes) {
    return <MiPlanSkeleton />;
  }

  if (asignacionesConPlanId.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Todavía no tienes planes asignados</CardTitle>
          <CardDescription>Cuando tu entrenador te asigne planes, aparecerán aquí.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const planesConAsignacion = asignacionesConPlanId.map((item) => ({
    asignacion: item.asignacion,
    plan: planes.find((plan) => plan.id === item.planId),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1C1D]">Mis planes</h1>
        <p className="text-sm text-[#616467]">Consulta las rutinas asignadas por tu entrenador.</p>
      </div>

      {planesConAsignacion.map(({ asignacion, plan }) => (
        <Card key={asignacion.id}>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>{plan?.nombre ?? asignacion.planDeEntrenamiento?.nombre ?? "Plan no disponible"}</CardTitle>
                {plan?.descripcion ? <CardDescription>{plan.descripcion}</CardDescription> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {plan?.tipo ? <Badge>{plan.tipo}</Badge> : null}
                {plan?.estado ? <Badge variant="secondary">Plan {plan.estado}</Badge> : null}
                <Badge variant={asignacion.estado === "ACTIVO" ? "default" : "outline"}>
                  Asignación {asignacion.estado}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!plan ? (
              <p className="text-sm text-[#616467]">No se pudo cargar el detalle de este plan.</p>
            ) : plan.ejercicios.length === 0 ? (
              <p className="text-sm text-[#616467]">Este plan aún no tiene ejercicios.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB]">
                    <TableHead className="text-[#616467]">Orden</TableHead>
                    <TableHead className="text-[#616467]">Ejercicio</TableHead>
                    <TableHead className="text-[#616467]">Grupo</TableHead>
                    <TableHead className="text-[#616467]">Series</TableHead>
                    <TableHead className="text-[#616467]">Reps</TableHead>
                    <TableHead className="text-[#616467]">Descanso</TableHead>
                    <TableHead className="text-[#616467]">Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.ejercicios.map((ejercicioPlan) => (
                    <TableRow key={ejercicioPlan.id} className="border-[#E5E7EB]">
                      <TableCell className="text-[#616467]">{ejercicioPlan.orden}</TableCell>
                      <TableCell className="font-medium text-[#1A1C1D]">{ejercicioPlan.ejercicio.nombre}</TableCell>
                      <TableCell className="text-[#616467]">{ejercicioPlan.ejercicio.grupoMuscular}</TableCell>
                      <TableCell className="text-[#616467]">{ejercicioPlan.series}</TableCell>
                      <TableCell className="text-[#616467]">{ejercicioPlan.repeticiones}</TableCell>
                      <TableCell className="text-[#616467]">{ejercicioPlan.segundosDeDescanso}s</TableCell>
                      <TableCell className="text-[#616467]">{ejercicioPlan.notas || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MiPlanSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full rounded-[18px]" />
          <Skeleton className="h-10 w-full rounded-[18px]" />
          <Skeleton className="h-10 w-full rounded-[18px]" />
        </CardContent>
      </Card>
    </div>
  );
}
