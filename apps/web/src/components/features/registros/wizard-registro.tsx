"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import type { AsignacionEntrenamiento, GrupoMuscular, PlanDeEntrenamiento } from "@/lib/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type PlanFromApi = PlanDeEntrenamiento & { ejercicioPlanes?: PlanDeEntrenamiento["ejercicios"] };

type EjercicioRegistroForm = {
  ejercicioPlanId?: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  seriesObjetivo?: number;
  repeticionesObjetivo?: number;
  descansoObjetivo?: number;
  notasDelPlan?: string;
  series: number;
  repeticiones: number;
  pesoKg?: number;
  notas?: string;
};

type State = {
  paso: 1 | 2 | 3;
  fecha: string;
  duracionMin: number | "";
  notas: string;
  planSeleccionadoId?: string;
  ejercicios: EjercicioRegistroForm[];
  ejerciciosInicializadosParaPlan?: string;
};

type Action =
  | { type: "setPaso"; paso: 1 | 2 | 3 }
  | { type: "setGeneral"; field: "fecha" | "duracionMin" | "notas"; value: string }
  | { type: "setPlanSeleccionado"; planId: string }
  | { type: "setEjerciciosIniciales"; planId: string; ejercicios: EjercicioRegistroForm[] }
  | { type: "setEjercicio"; index: number; field: keyof EjercicioRegistroForm; value: string }
  | { type: "agregarEjercicio" };

const gruposMusculares: GrupoMuscular[] = ["PECHO", "ESPALDA", "HOMBROS", "BICEPS", "TRICEPS", "PIERNAS", "GLUTEOS", "CORE", "CUERPO_COMPLETO", "OTRO"];

const today = new Date().toISOString().slice(0, 10);

const initialState: State = {
  paso: 1,
  fecha: today,
  duracionMin: 60,
  notas: "",
  planSeleccionadoId: undefined,
  ejercicios: [],
  ejerciciosInicializadosParaPlan: undefined,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setPaso":
      return { ...state, paso: action.paso };
    case "setGeneral":
      return {
        ...state,
        [action.field]: action.field === "duracionMin" ? (action.value === "" ? "" : Number(action.value)) : action.value,
      };
    case "setPlanSeleccionado":
      return {
        ...state,
        planSeleccionadoId: action.planId,
        ejercicios: [],
        ejerciciosInicializadosParaPlan: undefined,
      };
    case "setEjerciciosIniciales":
      if (state.ejerciciosInicializadosParaPlan === action.planId) {return state;}
      return { ...state, ejercicios: action.ejercicios, ejerciciosInicializadosParaPlan: action.planId };
    case "setEjercicio":
      return {
        ...state,
        ejercicios: state.ejercicios.map((ejercicio, index) => index === action.index
          ? {
              ...ejercicio,
              [action.field]: ["series", "repeticiones", "pesoKg"].includes(action.field)
                ? (action.value === "" ? undefined : Number(action.value))
                : action.value,
            }
          : ejercicio),
      };
    case "agregarEjercicio":
      return {
        ...state,
        ejercicios: [
          ...state.ejercicios,
          { nombre: "", grupoMuscular: "PECHO", series: 3, repeticiones: 10, notas: "" },
        ],
      };
    default:
      return state;
  }
}

async function fetchAsignaciones(clienteId: string) {
  const response = await apiFetch<AsignacionEntrenamiento[] | { data: AsignacionEntrenamiento[] }>(`/api/clientes/${clienteId}/asignaciones`);
  return unwrapData(response);
}

async function fetchPlan(planId: string) {
  const response = await apiFetch<PlanFromApi | { data: PlanFromApi }>(`/api/planes-entrenamiento/${planId}`);
  const plan = unwrapData(response);
  return { ...plan, ejercicios: plan.ejercicios ?? plan.ejercicioPlanes ?? [] };
}

export function WizardRegistro({ clienteId }: { clienteId: string }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: asignaciones = [], isLoading: loadingAsignaciones } = useQuery({
    queryKey: ["mi-plan", clienteId, "asignaciones"],
    queryFn: () => fetchAsignaciones(clienteId),
  });

  const asignacionesActivas = asignaciones.filter((asignacion) => asignacion.estado === "ACTIVO");
  const planId = state.planSeleccionadoId;

  useEffect(() => {
    if (state.planSeleccionadoId || asignacionesActivas.length === 0) {return;}

    const primeraAsignacion = asignacionesActivas[0];
    const primerPlanId = primeraAsignacion.planEntrenamientoId ?? primeraAsignacion.planDeEntrenamientoId;

    if (primerPlanId) {
      dispatch({ type: "setPlanSeleccionado", planId: primerPlanId });
    }
  }, [asignacionesActivas, state.planSeleccionadoId]);

  const asignacionSeleccionada = asignacionesActivas.find((asignacion) => {
    const id = asignacion.planEntrenamientoId ?? asignacion.planDeEntrenamientoId;
    return id === planId;
  });

  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ["mi-plan", clienteId, planId],
    queryFn: () => fetchPlan(planId!),
    enabled: !!planId && !asignacionSeleccionada?.planEntrenamiento,
    initialData: asignacionSeleccionada?.planEntrenamiento,
  });

  useEffect(() => {
    if (!plan || !planId || state.ejerciciosInicializadosParaPlan === planId) {return;}
    dispatch({
      type: "setEjerciciosIniciales",
      planId,
      ejercicios: plan.ejercicios.map((ejercicioPlan) => ({
        ejercicioPlanId: ejercicioPlan.id,
        nombre: ejercicioPlan.ejercicio.nombre,
        grupoMuscular: ejercicioPlan.ejercicio.grupoMuscular,
        seriesObjetivo: ejercicioPlan.series,
        repeticionesObjetivo: ejercicioPlan.repeticiones,
        descansoObjetivo: ejercicioPlan.segundosDeDescanso,
        notasDelPlan: ejercicioPlan.notas ?? undefined,
        series: ejercicioPlan.series,
        repeticiones: ejercicioPlan.repeticiones,
        notas: "",
      })),
    });
  }, [plan, planId, state.ejerciciosInicializadosParaPlan]);

  const mutation = useMutation({
    mutationFn: () => apiFetch(`/api/clientes/${clienteId}/registros-entrenamiento`, {
      method: "POST",
      body: JSON.stringify({
        fecha: state.fecha,
        duracionMin: Number(state.duracionMin),
        notas: state.notas || undefined,
        planDeEntrenamientoId: plan?.id,
        ejercicios: state.ejercicios.map((ejercicio) => ({
          nombre: ejercicio.nombre,
          grupoMuscular: ejercicio.grupoMuscular,
          series: ejercicio.series,
          repeticiones: ejercicio.repeticiones,
          pesoKg: ejercicio.pesoKg ?? undefined,
          notas: ejercicio.notas || undefined,
        })),
      }),
    }),
    onSuccess: () => {
      toast.success("Resultados guardados. Tu plan sigue disponible para repetirlo cuando quieras.");
      queryClient.invalidateQueries({ queryKey: ["progreso", clienteId] });
      queryClient.invalidateQueries({ queryKey: ["registros", clienteId] });
      router.push("/cliente/progreso");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo guardar el registro"),
  });

  if (loadingAsignaciones || loadingPlan) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
        <CardContent className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
      </Card>
    );
  }

  const puedeContinuarPaso1 = !!state.fecha && state.duracionMin !== "" && state.duracionMin > 0 && (!!plan || asignacionesActivas.length === 0);
  const puedeGuardar = state.ejercicios.length > 0 && state.ejercicios.every((ejercicio) => ejercicio.nombre && ejercicio.series > 0 && ejercicio.repeticiones > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar entrenamiento</CardTitle>
        <CardDescription>
          Builder paso {state.paso} de 3: guarda tus resultados de hoy. El plan no se completa ni se desactiva; queda disponible para repetirlo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.paso === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input id="fecha" type="date" value={state.fecha} onChange={(event) => dispatch({ type: "setGeneral", field: "fecha", value: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracionMin">Duración (min)</Label>
                <Input id="duracionMin" type="number" min={1} value={state.duracionMin} onChange={(event) => dispatch({ type: "setGeneral", field: "duracionMin", value: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>¿Qué plan hiciste hoy?</Label>
              {asignacionesActivas.length > 0 ? (
                <Select value={state.planSeleccionadoId} onValueChange={(value) => dispatch({ type: "setPlanSeleccionado", planId: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger>
                  <SelectContent>
                    {asignacionesActivas.map((asignacion) => {
                      const id = asignacion.planEntrenamientoId ?? asignacion.planDeEntrenamientoId;
                      const nombre = asignacion.planEntrenamiento?.nombre ?? asignacion.planDeEntrenamiento?.nombre ?? "Plan asignado";
                      return id ? <SelectItem key={id} value={id}>{nombre}</SelectItem> : null;
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">No tienes un plan activo asignado. Puedes registrar ejercicios libres.</p>
              )}
              <p className="text-xs text-slate-500">Solo guardaremos tus resultados de esta sesión; tu plan seguirá activo para repetirlo.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" value={state.notas} onChange={(event) => dispatch({ type: "setGeneral", field: "notas", value: event.target.value })} placeholder="Sensaciones generales de la sesión" />
            </div>
          </div>
        ) : null}

        {state.paso === 2 ? (
          <div className="space-y-4">
            {plan ? (
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                <strong>Ejercicios del plan:</strong> completa tus resultados de hoy. Nombre, grupo y objetivo vienen del plan y no se editan aquí.
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tienes plan activo; puedes agregar ejercicios libres.</p>
            )}
            <div className="space-y-4">
              {state.ejercicios.map((ejercicio, index) => (
                <div key={ejercicio.ejercicioPlanId ?? index} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium"><Dumbbell className="h-4 w-4" /> {ejercicio.nombre || `Ejercicio ${index + 1}`}</p>
                      <p className="text-xs text-slate-500">{ejercicio.grupoMuscular}</p>
                    </div>
                    {ejercicio.seriesObjetivo && ejercicio.repeticionesObjetivo ? (
                      <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        Objetivo: {ejercicio.seriesObjetivo} x {ejercicio.repeticionesObjetivo}
                        {ejercicio.descansoObjetivo ? ` · descanso ${ejercicio.descansoObjetivo}s` : ""}
                      </div>
                    ) : null}
                  </div>
                  {ejercicio.notasDelPlan ? <p className="mb-3 text-xs text-slate-500">Nota del plan: {ejercicio.notasDelPlan}</p> : null}
                  {!plan ? (
                    <div className="mb-3 grid gap-3 md:grid-cols-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Nombre</Label>
                        <Input value={ejercicio.nombre} onChange={(event) => dispatch({ type: "setEjercicio", index, field: "nombre", value: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Grupo</Label>
                        <Select value={ejercicio.grupoMuscular} onValueChange={(value) => dispatch({ type: "setEjercicio", index, field: "grupoMuscular", value })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{gruposMusculares.map((grupo) => <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Series realizadas</Label>
                      <Input type="number" min={1} value={ejercicio.series} onChange={(event) => dispatch({ type: "setEjercicio", index, field: "series", value: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reps realizadas</Label>
                      <Input type="number" min={1} value={ejercicio.repeticiones} onChange={(event) => dispatch({ type: "setEjercicio", index, field: "repeticiones", value: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso kg</Label>
                      <Input type="number" min={0} value={ejercicio.pesoKg ?? ""} onChange={(event) => dispatch({ type: "setEjercicio", index, field: "pesoKg", value: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Input value={ejercicio.notas ?? ""} onChange={(event) => dispatch({ type: "setEjercicio", index, field: "notas", value: event.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!plan ? (
              <Button type="button" variant="outline" onClick={() => dispatch({ type: "agregarEjercicio" })}>
                Agregar ejercicio libre
              </Button>
            ) : null}
          </div>
        ) : null}

        {state.paso === 3 ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 text-sm">
              <p><strong>Fecha:</strong> {state.fecha}</p>
              <p><strong>Duración:</strong> {state.duracionMin || "—"} min</p>
              <p><strong>Notas:</strong> {state.notas || "—"}</p>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Ejercicio</TableHead><TableHead>Grupo</TableHead><TableHead>Series</TableHead><TableHead>Reps</TableHead><TableHead>Peso</TableHead></TableRow></TableHeader>
              <TableBody>
                {state.ejercicios.map((ejercicio, index) => (
                  <TableRow key={index}><TableCell>{ejercicio.nombre}</TableCell><TableCell>{ejercicio.grupoMuscular}</TableCell><TableCell>{ejercicio.series}</TableCell><TableCell>{ejercicio.repeticiones}</TableCell><TableCell>{ejercicio.pesoKg ?? "—"}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" disabled={state.paso === 1 || mutation.isPending} onClick={() => dispatch({ type: "setPaso", paso: state.paso === 3 ? 2 : 1 })}>Atrás</Button>
        {state.paso < 3 ? (
          <Button disabled={(state.paso === 1 && !puedeContinuarPaso1) || (state.paso === 2 && !puedeGuardar)} onClick={() => dispatch({ type: "setPaso", paso: state.paso === 1 ? 2 : 3 })}>Siguiente</Button>
        ) : (
          <Button disabled={!puedeGuardar || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Guardando..." : "Guardar registro"}</Button>
        )}
      </CardFooter>
    </Card>
  );
}
