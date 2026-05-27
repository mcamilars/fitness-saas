"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/api-fetch";
import { unwrapData } from "@/lib/api/unwrap";
import { useAuth, useMiClienteId } from "@/lib/auth/auth-context";

type ClienteMeResponse = {
  cliente: {
    id: string;
    usuarioId: string;
    espacioDeTrabajoId: string;
    usuario?: {
      correo: string;
      nombre: string;
      apellido?: string;
    };
  };
};

async function fetchClienteMe() {
  const response = await apiFetch<ClienteMeResponse | { data: ClienteMeResponse }>("/api/clientes/me");
  return unwrapData(response).cliente;
}

export function useMiClienteIdResolved() {
  const { user, token, login } = useAuth();
  const clienteIdLocal = useMiClienteId();
  const necesitaResolver = !!user && user.rol === "CLIENTE" && !user.clienteId;

  const query = useQuery({
    queryKey: ["cliente-me"],
    queryFn: fetchClienteMe,
    enabled: necesitaResolver,
  });

  useEffect(() => {
    if (!token || !user || !query.data || user.clienteId) {return;}

    login(token, {
      ...user,
      id: query.data.usuarioId,
      clienteId: query.data.id,
      workspaceId: query.data.espacioDeTrabajoId,
      correo: query.data.usuario?.correo ?? user.correo,
      nombre: query.data.usuario?.nombre ?? user.nombre,
      apellido: query.data.usuario?.apellido ?? user.apellido,
    });
  }, [login, query.data, token, user]);

  return {
    clienteId: user?.clienteId ?? (necesitaResolver ? query.data?.id : clienteIdLocal),
    isLoading: query.isLoading,
    error: query.error,
  };
}
