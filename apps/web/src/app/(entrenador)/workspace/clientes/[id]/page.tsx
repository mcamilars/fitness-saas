"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/api-fetch";
import type { DashboardCliente, Ejercicio, GrupoMuscular } from "@/lib/types/api";
import { format } from "date-fns";
import { ArrowLeft, MoreHorizontal, Eye, UserX, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toastConUndo } from "@/lib/ui/toast-undo";
import { showApiError } from "@/lib/hooks/use-api-error-toast";

interface DashboardFromApi {
  cliente: {
    id: string;
    estaActivo: boolean;
    creadoEn: string;
    usuario: {
      nombre: string;
      apellido: string | null;
      correo: string;
    };
  };
  planActivo: {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    ejercicioPlanes: {
      id: string;
      ejercicioId: string;
      series: number;
      repeticiones: number;
      segundosDeDescanso: number;
      orden: number;
      notas: string | null;
      ejercicio: {
        id: string;
        nombre: string;
        grupoMuscular: string;
      };
    }[];
  } | null;
  ultimosRegistros: {
    id: string;
    fecha: string;
    duracionMin: number;
    notas: string | null;
    ejercicios: {
      id: string;
      nombre: string;
      grupoMuscular: string;
      series: number;
      repeticiones: number;
      pesoKg: number | null;
      notas: string | null;
    }[];
  }[];
  progresoSemanal: {
    totalSesiones: number;
    periodos: {
      etiqueta: string;
      totalSesiones: number;
      duracionTotalMin: number;
    }[];
  };
}

async function fetchDashboard(id: string): Promise<DashboardCliente> {
  const res = await apiFetch<{ data: { dashboard: DashboardFromApi } }>(`/api/clientes/${id}/dashboard`);
  const d = res.data?.dashboard;
  if (!d) {
    throw new Error("Dashboard no encontrado");
  }
  const mapped: DashboardCliente = {
    cliente: {
      id: d.cliente.id,
      nombre: d.cliente.usuario.nombre,
      apellido: d.cliente.usuario.apellido ?? "",
      correo: d.cliente.usuario.correo,
      estado: d.cliente.estaActivo ? "ACTIVO" : "INACTIVO",
      fechaAlta: d.cliente.creadoEn,
      workspaceId: "",
      planActivoId: d.planActivo?.id,
    },
    planActivo: d.planActivo
      ? {
          id: d.planActivo.id,
          nombre: d.planActivo.nombre,
          descripcion: "",
          tipo: d.planActivo.tipo as "HIPERTROFIA" | "FUERZA" | "RESISTENCIA",
          estado: d.planActivo.estado as "BORRADOR" | "ACTIVO" | "ARCHIVADO",
          workspaceId: "",
          ejercicios: d.planActivo.ejercicioPlanes.map((ep) => ({
            id: ep.id,
            planId: d.planActivo!.id,
            ejercicioId: ep.ejercicioId,
            ejercicio: { id: ep.ejercicio.id, nombre: ep.ejercicio.nombre, grupoMuscular: ep.ejercicio.grupoMuscular as GrupoMuscular, descripcion: "", instrucciones: "", creadoEn: "" } as Ejercicio,
            orden: ep.orden,
            series: ep.series,
            repeticiones: ep.repeticiones,
            segundosDeDescanso: ep.segundosDeDescanso,
            notas: ep.notas ?? undefined,
          })),
          creadoEn: "",
          actualizadoEn: "",
        }
      : undefined,
    ultimosRegistros: d.ultimosRegistros.map((r) => ({
      id: r.id,
      clienteId: d.cliente.id,
      planId: undefined,
      fecha: r.fecha,
      duracionMin: r.duracionMin,
      notas: r.notas ?? undefined,
      ejercicios: r.ejercicios.map((e) => ({
        id: e.id,
        registroId: r.id,
        ejercicioId: e.id,
        ejercicio: { id: e.id, nombre: e.nombre, grupoMuscular: e.grupoMuscular as GrupoMuscular, descripcion: "", instrucciones: "", creadoEn: "" } as Ejercicio,
        series: e.series,
        repeticiones: e.repeticiones,
        pesoKg: e.pesoKg ?? undefined,
        notas: e.notas ?? undefined,
      })),
      creadoEn: "",
    })),
    progresoSemanal: d.progresoSemanal.periodos.map((p) => ({
      etiqueta: p.etiqueta,
      entrenamientos: p.totalSesiones,
      volumenTotal: p.duracionTotalMin,
      pesoPromedio: undefined,
    })),
  };
  return mapped;
}

async function deactivateCliente(id: string): Promise<void> {
  return apiFetch(`/api/clientes/${id}`, { method: "DELETE" });
}

const estadoColors: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-800",
  INACTIVO: "bg-slate-100 text-slate-800",
  PENDIENTE: "bg-yellow-100 text-yellow-800",
};

const estadoLabels: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  PENDIENTE: "Pendiente",
};

const tipoPlanColors: Record<string, string> = {
  HIPERTROFIA: "bg-purple-100 text-purple-800",
  FUERZA: "bg-red-100 text-red-800",
  RESISTENCIA: "bg-blue-100 text-blue-800",
};

const tipoPlanLabels: Record<string, string> = {
  HIPERTROFIA: "Hipertrofia",
  FUERZA: "Fuerza",
  RESISTENCIA: "Resistencia",
};

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClienteDashboardPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDesactivarDialog, setShowDesactivarDialog] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setClienteId(p.id));
  }, [params]);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["cliente-dashboard", clienteId],
    queryFn: () => fetchDashboard(clienteId!),
    enabled: !!clienteId,
  });

  const desactivarMutation = useMutation({
    mutationFn: () => deactivateCliente(clienteId!),
    onSuccess: () => {
      toastConUndo({
        mensaje: "Cliente desactivado",
        onUndo: async () => {
          await apiFetch(`/api/commands/undo`, { method: "POST" });
          queryClient.invalidateQueries({ queryKey: ["clientes"] });
          queryClient.invalidateQueries({ queryKey: ["cliente-dashboard", clienteId] });
        },
      });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente-dashboard", clienteId] });
      setShowDesactivarDialog(false);
    },
    onError: showApiError,
  });

  if (!clienteId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  const initials = dashboard?.cliente
    ? `${dashboard.cliente.nombre[0] ?? ""}${dashboard.cliente.apellido?.[0] ?? ""}`.toUpperCase()
    : "??";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {isLoading || !dashboard || !clienteId ? "..." : `${dashboard?.cliente?.nombre ?? ""} ${dashboard?.cliente?.apellido ?? ""}`}
          </h1>
        </div>
        {!isLoading && dashboard && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setShowDesactivarDialog(true)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Desactivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {isLoading || !dashboard ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">
                      {dashboard?.cliente.nombre} {dashboard?.cliente.apellido}
                    </p>
                    <p className="text-sm text-slate-500">{dashboard?.cliente.correo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn("capitalize", estadoColors[dashboard?.cliente.estado ?? "ACTIVO"])}
                    variant="secondary"
                  >
                    {estadoLabels[dashboard?.cliente.estado ?? "ACTIVO"]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  Cliente desde{" "}
                  {dashboard?.cliente.fechaAlta
                    ? format(new Date(dashboard.cliente.fechaAlta), "dd/MM/yyyy")
                    : "-"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan activo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard?.planActivo ? (
                  <>
                    <p className="font-medium text-slate-900">{dashboard.planActivo.nombre}</p>
                    <div className="flex gap-2">
                      <Badge
                        className={tipoPlanColors[dashboard.planActivo.tipo]}
                        variant="secondary"
                      >
                        {tipoPlanLabels[dashboard.planActivo.tipo]}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800" variant="secondary">
                        {dashboard.planActivo.ejercicios?.length ?? 0} ejercicios
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        router.push(`/workspace/planes/${dashboard?.planActivo?.id}`)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver plan
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Sin plan asignado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Últimos registros</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.ultimosRegistros && dashboard.ultimosRegistros.length > 0 ? (
                  <ul className="space-y-2">
                    {dashboard.ultimosRegistros.slice(0, 5).map((registro) => (
                      <li
                        key={registro.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          {format(new Date(registro.fecha), "dd/MM/yyyy")}
                        </span>
                        <span className="text-slate-500">
                          {registro.duracionMin} min · {registro.ejercicios?.length ?? 0}{" "}
                          ejercicios
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Sin registros aún</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso semanal</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.progresoSemanal && dashboard.progresoSemanal.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-xs font-medium text-slate-500">
                      <span>Semana</span>
                      <span className="text-center">Entrenos</span>
                      <span className="text-right">Volumen</span>
                    </div>
                    {dashboard.progresoSemanal.map((semana, i) => (
                      <div key={i} className="grid grid-cols-3 text-sm">
                        <span className="text-slate-700">{semana.etiqueta}</span>
                        <span className="text-center text-slate-600">
                          {semana.entrenamientos}
                        </span>
                        <span className="text-right text-slate-600">
                          {semana.volumenTotal.toLocaleString()} kg
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Sin datos de progreso</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={showDesactivarDialog} onOpenChange={setShowDesactivarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar cliente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desactivar a{" "}
              <strong>
                {dashboard?.cliente.nombre} {dashboard?.cliente.apellido}
              </strong>
              ? El cliente perderá acceso a su cuenta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDesactivarDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => desactivarMutation.mutate()}
            >
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}