"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Filter, Plus, Video } from "lucide-react";
import Image from "next/image";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import type { Ejercicio, GrupoMuscular } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogNuevoEjercicio } from "@/components/features/ejercicios/dialog-nuevo-ejercicio";


const GRUPO_LABELS: Record<GrupoMuscular, string> = {
  PECHO: "Pecho",
  ESPALDA: "Espalda",
  HOMBROS: "Hombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  PIERNAS: "Piernas",
  GLUTEOS: "Glúteos",
  CORE: "Core",
  CUERPO_COMPLETO: "Cuerpo completo",
  OTRO: "Otro",
};

async function fetchEjercicios(): Promise<Ejercicio[]> {
  const res = await apiFetch<{ data: Ejercicio[] } | Ejercicio[]>("/api/ejercicios");
  return unwrapData(res);
}

async function fetchEjerciciosPorGrupo(grupo: GrupoMuscular): Promise<Ejercicio[]> {
  const res = await apiFetch<{ data: Ejercicio[] } | Ejercicio[]>(`/api/ejercicios/por-grupo/${grupo}`);
  return unwrapData(res);
}

export default function EjerciciosPage() {
  const [open, setOpen] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoMuscular | "TODOS">("TODOS");

  const { data: ejercicios, isLoading, isError, refetch } = useQuery({
    queryKey: ["ejercicios", grupoSeleccionado],
    queryFn: () =>
      grupoSeleccionado === "TODOS"
        ? fetchEjercicios()
        : fetchEjerciciosPorGrupo(grupoSeleccionado),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de ejercicios</h1>
          <p className="text-sm text-slate-500">Gestiona los ejercicios disponibles en tu espacio.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo ejercicio
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-500" />
        <Select
          value={grupoSeleccionado}
          onValueChange={(val) => setGrupoSeleccionado(val as GrupoMuscular | "TODOS")}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por grupo muscular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los grupos</SelectItem>
            {(Object.keys(GRUPO_LABELS) as GrupoMuscular[]).map((grupo) => (
              <SelectItem key={grupo} value={grupo}>
                {GRUPO_LABELS[grupo]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <EjerciciosSkeleton />
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>No se pudieron cargar los ejercicios</CardTitle>
            <CardDescription>Intenta nuevamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : ejercicios?.length === 0 ? (
        <EmptyEjercicios onNuevo={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ejercicios?.map((ejercicio) => (
            <Card key={ejercicio.id}>
              {!ejercicio.imagenUrl ? (
                <div className="flex aspect-video h-40 w-full items-center justify-center bg-slate-100">
                  <Dumbbell className="h-10 w-10 text-slate-300" />
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-slate-100">
                  <Image
                    src={ejercicio.imagenUrl}
                    alt={ejercicio.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg">{ejercicio.nombre}</CardTitle>
                  <Badge variant="secondary">{GRUPO_LABELS[ejercicio.grupoMuscular]}</Badge>
                </div>
                {ejercicio.descripcion && (
                  <CardDescription>{ejercicio.descripcion}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {ejercicio.instrucciones && (
                  <p className="line-clamp-2">{ejercicio.instrucciones}</p>
                )}
                {ejercicio.videoUrl && (
                  <a
                    href={ejercicio.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Video className="h-4 w-4" />
                    Ver video
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DialogNuevoEjercicio open={open} onOpenChange={setOpen} />
    </div>
  );
}

function EmptyEjercicios({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
      <Dumbbell className="mx-auto mb-4 h-10 w-10 text-slate-400" />
      <h3 className="mb-2 text-lg font-medium text-slate-900">Sin ejercicios</h3>
      <p className="mb-6 text-sm text-slate-500">
        Agrega ejercicios para construir tus planes de entrenamiento.
      </p>
      <Button onClick={onNuevo}>Nuevo ejercicio</Button>
    </div>
  );
}

function EjerciciosSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <Skeleton className="h-40 w-full rounded-t-lg" />
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
