"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { showApiError } from "@/lib/hooks/use-api-error-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

const clienteSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().optional(),
});

type ClienteForm = z.infer<typeof clienteSchema>;

async function verificarInvitacion(token: string) {
  const res = await fetch(`/api/invitaciones/${token}/verificar`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.mensaje || "Invitación inválida");
  }
  return res.json();
}

async function registrarCliente(token: string, data: ClienteForm) {
  const res = await fetch(`/api/auth/cliente/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, ...data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.mensaje || "Error al registrar");
  }
  return res.json();
}

const InvitacionPage = ({ params }: { params: Promise<{ token: string }> }) => {
  const { login } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  const { data: invitacion, isLoading } = useQuery({
    queryKey: ["invitacion", token],
    queryFn: () => verificarInvitacion(token!),
    enabled: !!token,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ClienteForm) => registrarCliente(token!, data),
    onSuccess: (data) => {
      login(data.token, data.usuario);
      router.push("/cliente/plan");
    },
    onError: showApiError,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!invitacion?.valida) {
    return (
      <Card>
        <CardHeader><CardTitle>Invitación no válida</CardTitle></CardHeader>
        <CardContent>
          <p className="text-red-500">{invitacion?.mensaje || "Esta invitación ha expirado o ya fue utilizada."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completa tu registro</CardTitle>
        <CardDescription>Ingresa tus datos para unirte a {invitacion.workspaceNombre}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" value={invitacion.correo} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" {...register("nombre")} placeholder="Tu nombre" />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" {...register("apellido")} placeholder="Tu apellido" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contrasena">Contraseña</Label>
            <Input id="contrasena" type="password" {...register("contrasena")} placeholder="••••••" />
            {errors.contrasena && <p className="text-sm text-red-500">{errors.contrasena.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvitacionPage;