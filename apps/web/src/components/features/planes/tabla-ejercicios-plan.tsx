"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import type { Ejercicio, PlanDeEntrenamiento } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  ejercicioId: z.string().min(1, "Selecciona un ejercicio"),
  series: z.coerce.number().int().min(1),
  repeticiones: z.coerce.number().int().min(1),
  segundosDeDescanso: z.coerce.number().int().min(0),
  orden: z.coerce.number().int().min(1),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

async function fetchEjercicios(): Promise<Ejercicio[]> {
  const response = await apiFetch<Ejercicio[] | { data: Ejercicio[] }>("/api/ejercicios");
  return unwrapData(response);
}

export function TablaEjerciciosPlan({ plan }: { plan: PlanDeEntrenamiento }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const archivado = plan.estado === "ARCHIVADO";
  const ejercicios = [...(plan.ejercicios ?? [])].sort((a, b) => a.orden - b.orden);

  const eliminar = useMutation({
    mutationFn: (ejercicioPlanId: string) => apiFetch(`/api/planes-entrenamiento/${plan.id}/ejercicios/${ejercicioPlanId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Ejercicio eliminado del plan");
      queryClient.invalidateQueries({ queryKey: ["plan", plan.id] });
      queryClient.invalidateQueries({ queryKey: ["planes"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo eliminar el ejercicio"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ejercicios</h2>
          {archivado ? <p className="text-sm text-slate-500">Los planes archivados no se pueden modificar.</p> : null}
        </div>
        <Button disabled={archivado} onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar ejercicio
        </Button>
      </div>

      {ejercicios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Este plan todavía no tiene ejercicios.</div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Ejercicio</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Descanso</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ejercicios.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.orden}</TableCell>
                  <TableCell className="font-medium">{item.ejercicio?.nombre ?? item.ejercicioId}</TableCell>
                  <TableCell>{item.ejercicio?.grupoMuscular ?? "—"}</TableCell>
                  <TableCell>{item.series}</TableCell>
                  <TableCell>{item.repeticiones}</TableCell>
                  <TableCell>{item.segundosDeDescanso ?? 0}s</TableCell>
                  <TableCell className="max-w-48 truncate">{item.notas || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      disabled={archivado || eliminar.isPending}
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminar.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogAgregarEjercicio open={open} onOpenChange={setOpen} plan={plan} />
    </div>
  );
}

function DialogAgregarEjercicio({ open, onOpenChange, plan }: { open: boolean; onOpenChange: (open: boolean) => void; plan: PlanDeEntrenamiento }) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ejercicioId: "",
      series: 4,
      repeticiones: 10,
      segundosDeDescanso: 60,
      orden: (plan.ejercicios?.length ?? 0) + 1,
      notas: "",
    },
  });
  const { data: ejercicios, isLoading, isError, refetch } = useQuery({ queryKey: ["ejercicios"], queryFn: fetchEjercicios, enabled: open });
  const ejercicioId = useWatch({ control: form.control, name: "ejercicioId" });

  const agregar = useMutation({
    mutationFn: async (values: FormValues) => apiFetch(`/api/planes-entrenamiento/${plan.id}/ejercicios`, {
      method: "POST",
      body: JSON.stringify(values),
    }),
    onSuccess: async () => {
      toast.success("Ejercicio agregado al plan");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plan", plan.id] }),
        queryClient.invalidateQueries({ queryKey: ["planes"] }),
      ]);
      onOpenChange(false);
      form.reset({
        ejercicioId: "",
        series: 4,
        repeticiones: 10,
        segundosDeDescanso: 60,
        orden: (plan.ejercicios?.length ?? 0) + 2,
        notas: "",
      });
    },
    onError: (error) => {
      const mensaje = error instanceof Error ? error.message : "No se pudo agregar el ejercicio";
      toast.error(Array.isArray(mensaje) ? mensaje.join(", ") : mensaje);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar ejercicio</DialogTitle>
          <DialogDescription>Selecciona un ejercicio del catálogo y configura sus parámetros.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => agregar.mutate(values))}>
          <div className="space-y-2">
            <Label>Ejercicio</Label>
            {isLoading ? <Skeleton className="h-9 w-full" /> : isError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>No se pudo cargar el catálogo de ejercicios.</p>
                <Button className="mt-2" size="sm" type="button" variant="outline" onClick={() => refetch()}>Reintentar</Button>
              </div>
            ) : (ejercicios ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed p-3 text-sm text-slate-500">El catálogo de ejercicios está vacío.</div>
            ) : (
              <Select value={ejercicioId} onValueChange={(value) => form.setValue("ejercicioId", value, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un ejercicio" /></SelectTrigger>
                <SelectContent>
                  {(ejercicios ?? []).map((ejercicio) => <SelectItem key={ejercicio.id} value={ejercicio.id}>{ejercicio.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {form.formState.errors.ejercicioId ? <p className="text-sm text-red-600">{form.formState.errors.ejercicioId.message}</p> : null}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Series" name="series" form={form} />
            <Field label="Reps" name="repeticiones" form={form} />
            <Field label="Descanso (s)" name="segundosDeDescanso" form={form} />
            <Field label="Orden" name="orden" form={form} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" {...form.register("notas")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={agregar.isPending || isError || (ejercicios ?? []).length === 0}>{agregar.isPending ? "Agregando..." : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, name, form }: { label: string; name: keyof Pick<FormValues, "series" | "repeticiones" | "segundosDeDescanso" | "orden">; form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type="number" {...form.register(name)} />
    </div>
  );
}
