"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import { showApiError } from "@/lib/hooks/use-api-error-toast";
import type { Cliente, PlanDeEntrenamiento } from "@/lib/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

async function asignarPlan(input: { clienteId: string; planEntrenamientoId: string }) {
  return apiFetch("/api/asignaciones/entrenamiento", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

interface DialogAsignarPlanProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogAsignarPlan({ cliente, open, onOpenChange }: DialogAsignarPlanProps) {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState("");

  const { data: planes, isLoading } = useQuery({
    queryKey: ["planes"],
    queryFn: fetchPlanes,
    enabled: open,
  });

  const planesActivos = useMemo(
    () => (planes ?? []).filter((plan) => plan.estado === "ACTIVO"),
    [planes]
  );

  const mutation = useMutation({
    mutationFn: asignarPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente-dashboard", cliente?.id] });
      queryClient.invalidateQueries({ queryKey: ["asignaciones", cliente?.id] });
      toast.success("Plan asignado", {
        description: cliente
          ? `El plan fue asignado a ${cliente.nombre} ${cliente.apellido}.`
          : "El plan fue asignado correctamente.",
      });
      setPlanId("");
      onOpenChange(false);
    },
    onError: showApiError,
  });

  const handleClose = (nuevoOpen: boolean) => {
    if (!nuevoOpen && !mutation.isPending) {
      setPlanId("");
    }
    onOpenChange(nuevoOpen);
  };

  const handleSubmit = () => {
    if (!cliente || !planId || mutation.isPending) {return;}
    mutation.mutate({ clienteId: cliente.id, planEntrenamientoId: planId });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar plan</DialogTitle>
          <DialogDescription>
            {cliente
              ? `Selecciona un plan activo para ${cliente.nombre} ${cliente.apellido}.`
              : "Selecciona un plan activo para el cliente."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : planesActivos.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No tienes planes activos. Activa un plan antes de asignarlo a un cliente.
          </p>
        ) : (
          <div className="space-y-2">
            <Label>Plan activo</Label>
            <Select value={planId} onValueChange={setPlanId} disabled={mutation.isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                {planesActivos.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nombre} · {plan.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!planId || !cliente || mutation.isPending || planesActivos.length === 0}
          >
            {mutation.isPending ? "Asignando..." : "Asignar plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
