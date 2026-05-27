"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ["notificaciones"],
    queryFn: fetchNotificaciones,
    refetchInterval: 30_000,
  });

  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;

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
            <DropdownMenuItem key={notificacion.id} className="flex flex-col items-start gap-1 whitespace-normal">
              <span className="text-sm">{notificacion.mensaje}</span>
              <span className="text-xs text-muted-foreground">
                {notificacion.creadoEn || notificacion.creadaEn
                  ? new Date(notificacion.creadoEn ?? notificacion.creadaEn!).toLocaleString()
                  : "Fecha no disponible"}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
