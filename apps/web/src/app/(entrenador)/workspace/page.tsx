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
import { Dumbbell, Plus, UserPlus } from "lucide-react";
import { DialogInvitarCliente } from "@/components/features/clientes/dialog-invitar-cliente";
import { DialogAsignarPlan } from "@/components/features/clientes/dialog-asignar-plan";

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
  ACTIVO: "bg-[#C8E874] text-[#1A1C1D]",
  INACTIVO: "bg-[#ECF2F5] text-[#616467]",
  PENDIENTE: "bg-[#FEF3C7] text-[#92400E]",
};

const estadoLabels: Record<EstadoCliente, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  PENDIENTE: "Pendiente",
};

export default function WorkspacePage() {
  const router = useRouter();
  const [showInvitar, setShowInvitar] = useState(false);
  const [clienteParaAsignar, setClienteParaAsignar] = useState<ClienteWithLastWorkout | null>(null);
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
          <h1 className="text-2xl font-bold text-[#1A1C1D]">Clientes</h1>
          <p className="text-sm text-[#616467]">
            {clientes?.length ?? 0} cliente{clientes?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowInvitar(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar cliente
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-[18px] border border-[#E5E7EB] bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead className="w-12 text-[#616467]">Avatar</TableHead>
                <TableHead className="text-[#616467]">Nombre</TableHead>
                <TableHead className="text-[#616467]">Correo</TableHead>
                <TableHead className="text-[#616467]">Estado</TableHead>
                <TableHead className="text-[#616467]">Último entrenamiento</TableHead>
                <TableHead className="text-right text-[#616467]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-[#E5E7EB]">
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-9 w-28 rounded-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : clientes?.length === 0 ? (
        <div className="rounded-[18px] border-2 border-dashed border-[#E5E7EB] bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECF2F5]">
            <UserPlus className="h-6 w-6 text-[#616467]" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[#1A1C1D]">
            No hay clientes aún
          </h3>
          <p className="mb-6 text-sm text-[#616467]">
            Invita a tus clientes para que puedan comenzar a entrenar.
          </p>
          <Button onClick={() => setShowInvitar(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invitar tu primer cliente
          </Button>
        </div>
      ) : (
        <div className="rounded-[18px] border border-[#E5E7EB] bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7EB]">
                <TableHead className="w-12 text-[#616467]">Avatar</TableHead>
                <TableHead className="text-[#616467]">Nombre</TableHead>
                <TableHead className="text-[#616467]">Correo</TableHead>
                <TableHead className="text-[#616467]">Estado</TableHead>
                <TableHead className="text-[#616467]">Último entrenamiento</TableHead>
                <TableHead className="text-right text-[#616467]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes?.map((cliente) => {
                const initials = `${cliente.nombre[0] ?? ""}${cliente.apellido?.[0] ?? ""}`.toUpperCase();
                return (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer border-[#E5E7EB] hover:bg-[#F4F4F4]"
                    onClick={() => router.push(`/workspace/clientes/${cliente.id}`)}
                  >
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#ECF2F5] text-[#616467] text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-[#1A1C1D]">
                      {cliente.nombre} {cliente.apellido}
                    </TableCell>
                    <TableCell className="text-[#616467]">
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
                    <TableCell className="text-[#616467]">
                      {cliente.ultimoEntrenamiento
                        ? formatDistanceToNow(new Date(cliente.ultimoEntrenamiento), {
                            addSuffix: true,
                          })
                        : "Sin registros"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          setClienteParaAsignar(cliente);
                        }}
                      >
                        <Dumbbell className="mr-2 h-4 w-4" />
                        Asignar plan
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogInvitarCliente open={showInvitar} onOpenChange={setShowInvitar} />
      <DialogAsignarPlan
        cliente={clienteParaAsignar}
        open={!!clienteParaAsignar}
        onOpenChange={(open) => {
          if (!open) {
            setClienteParaAsignar(null);
          }
        }}
      />
    </div>
  );
}
