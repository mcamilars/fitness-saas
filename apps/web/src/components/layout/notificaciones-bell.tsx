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
        <Button variant="ghost" size="icon" className="relative text-[#616467] hover:text-[#1A1C1D]" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8E874] px-1 text-[10px] font-bold text-[#1A1C1D]">
              {noLeidas}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
        <DropdownMenuLabel className="text-base font-semibold text-[#1A1C1D]">Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#E5E7EB]" />
        {isLoading ? (
          <DropdownMenuItem disabled className="text-[#616467]">Cargando...</DropdownMenuItem>
        ) : notificaciones.length === 0 ? (
          <DropdownMenuItem disabled className="text-[#616467]">No tienes notificaciones nuevas</DropdownMenuItem>
        ) : (
          notificaciones.slice(0, 10).map((notificacion) => (
            <DropdownMenuItem
              key={notificacion.id}
              className="flex flex-col items-start gap-1 whitespace-normal py-3 cursor-pointer"
              onClick={() => {
                if (!notificacion.leida) {
                  marcarLeida(notificacion.id);
                }
              }}
            >
              <span className={`text-sm ${!notificacion.leida ? "font-semibold text-[#1A1C1D]" : "text-[#616467]"}`}>
                {notificacion.mensaje}
              </span>
              <span className="text-xs text-[#9CA3AF]">
                {notificacion.creadoEn || notificacion.creadaEn
                  ? `hace ${formatDistanceToNow(new Date(notificacion.creadoEn ?? notificacion.creadaEn!), { locale: es })}`
                  : "Fecha no disponible"}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {noLeidas > 1 ? (
          <>
            <DropdownMenuSeparator className="bg-[#E5E7EB]" />
            <DropdownMenuItem
              className="flex items-center gap-2 justify-center text-[#C8E874] cursor-pointer font-medium"
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
