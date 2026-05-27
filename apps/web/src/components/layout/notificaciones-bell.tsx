"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import type { Notificacion } from "@/lib/types/api";

type NotificacionApi = Notificacion & { creadaEn?: string };

async function fetchNotificaciones() {
  const response = await apiFetch<NotificacionApi[] | { data: NotificacionApi[] }>("/api/notificaciones");
  return unwrapData(response);
}

export function NotificacionesBell() {
  const queryClient = useQueryClient();

  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: fetchNotificaciones,
    refetchInterval: 30_000,
  });

  const { mutate: marcarLeida } = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;

  const { mutate: marcarTodasLeidas, isPending: marcandoTodas } = useMutation({
    mutationFn: async () => {
      const ids = notificaciones
        .filter((notificacion) => !notificacion.leida)
        .map((notificacion) => notificacion.id);
      await Promise.all(
        ids.map((id) => apiFetch(`/api/notificaciones/${id}/leer`, { method: "PATCH" }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          {noLeidas > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {noLeidas}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>Cargando...</DropdownMenuItem>
        ) : notificaciones.length === 0 ? (
          <DropdownMenuItem disabled>No tienes notificaciones nuevas</DropdownMenuItem>
        ) : (
          notificaciones.slice(0, 10).map((notificacion) => (
            <DropdownMenuItem
              key={notificacion.id}
              className="flex flex-col items-start gap-1 whitespace-normal"
              onClick={() => {
                if (!notificacion.leida) {
                  marcarLeida(notificacion.id);
                }
              }}
            >
              <span className={`text-sm ${!notificacion.leida ? "font-medium" : ""}`}>
                {notificacion.mensaje}
              </span>
              <span className="text-xs text-muted-foreground">
                {notificacion.creadoEn || notificacion.creadaEn
                  ? `hace ${formatDistanceToNow(new Date(notificacion.creadoEn ?? notificacion.creadaEn!), { locale: es })}`
                  : "Fecha no disponible"}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {noLeidas > 1 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 justify-center text-blue-600"
              disabled={marcandoTodas}
              onClick={() => marcarTodasLeidas()}
            >
              <Check className="h-4 w-4" />
              <span>Marcar todas como leídas</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
