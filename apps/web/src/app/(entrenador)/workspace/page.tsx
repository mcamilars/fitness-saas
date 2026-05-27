"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth/auth-context";
import { apiFetch } from "@/lib/api/api-fetch";
import type { Cliente, EstadoCliente } from "@/lib/types/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, UserPlus } from "lucide-react";
import { DialogInvitarCliente } from "@/components/features/clientes/dialog-invitar-cliente";

interface ClienteWithLastWorkout extends Cliente {
  ultimoEntrenamiento?: string;
}

interface ClienteFromApi {
  id: string;
  estaActivo: boolean;
  usuario: {
    nombre: string;
    apellido: string | null;
    correo: string;
  };
}

async function fetchClientes(): Promise<ClienteWithLastWorkout[]> {
  const res = await apiFetch<{ data?: { clientes?: ClienteFromApi[] } | { clientes?: ClienteFromApi[] } | ClienteFromApi[] }>("/api/clientes");
  if (!res) {return [];}
  let clientes: ClienteFromApi[] = [];
  if (Array.isArray(res)) {
    clientes = res;
  } else if ("data" in res && res.data) {
    if (Array.isArray(res.data)) {
      clientes = res.data;
    } else {
      clientes = res.data.clientes ?? [];
    }
  } else if ("clientes" in res) {
    clientes = (res as { clientes?: ClienteFromApi[] }).clientes ?? [];
  }
  return clientes.map((c) => ({
    id: c.id,
    nombre: c.usuario.nombre,
    apellido: c.usuario.apellido ?? "",
    correo: c.usuario.correo,
    estado: c.estaActivo ? "ACTIVO" : "INACTIVO",
    fechaAlta: "",
    workspaceId: "",
  }));
}

const estadoColors: Record<EstadoCliente, string> = {
  ACTIVO: "bg-green-100 text-green-800",
  INACTIVO: "bg-slate-100 text-slate-800",
  PENDIENTE: "bg-yellow-100 text-yellow-800",
};

const estadoLabels: Record<EstadoCliente, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  PENDIENTE: "Pendiente",
};

export default function WorkspacePage() {
  const router = useRouter();
  const [showInvitar, setShowInvitar] = useState(false);
  const { user } = useAuth();

  const { data: clientes, isLoading, refetch } = useQuery({
    queryKey: ["clientes"],
    queryFn: fetchClientes,
  });

  useEffect(() => {
    refetch();
  }, [user?.workspaceId, refetch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">
            {clientes?.length ?? 0} cliente{clientes?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowInvitar(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar cliente
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Avatar</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último entrenamiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : clientes?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <UserPlus className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-slate-900">
            No hay clientes aún
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            Invita a tus clientes para que puedan comenzar a entrenar.
          </p>
          <Button onClick={() => setShowInvitar(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invitar tu primer cliente
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Avatar</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último entrenamiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes?.map((cliente) => {
                const initials = `${cliente.nombre[0] ?? ""}${cliente.apellido?.[0] ?? ""}`.toUpperCase();
                return (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(`/workspace/clientes/${cliente.id}`)}
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {cliente.nombre} {cliente.apellido}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {cliente.correo}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={estadoColors[cliente.estado]}
                        variant="secondary"
                      >
                        {estadoLabels[cliente.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {cliente.ultimoEntrenamiento
                        ? formatDistanceToNow(new Date(cliente.ultimoEntrenamiento), {
                            addSuffix: true,
                          })
                        : "Sin registros"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogInvitarCliente open={showInvitar} onOpenChange={setShowInvitar} />
    </div>
  );
}