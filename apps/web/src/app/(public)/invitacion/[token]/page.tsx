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
import { toast } from "sonner";

const clienteSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(8, "Mínimo 8 caracteres"),
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
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
    body: JSON.stringify({ tokenInvitacion: token, ...data }),
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

  const { data: result, isLoading } = useQuery({
    queryKey: ["invitacion", token],
    queryFn: () => verificarInvitacion(token!),
    enabled: !!token,
  });

  const invitacion = result?.data?.invitacion;
  const valida = result?.data?.valida;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      correo: "",
      nombre: "",
      apellido: "",
      contrasena: "",
    },
  });

  useEffect(() => {
    if (invitacion?.correo) {
      setValue("correo", invitacion.correo, { shouldValidate: true });
    }
  }, [invitacion?.correo, setValue]);

  const mutation = useMutation({
    mutationFn: (data: ClienteForm) => registrarCliente(token!, data),
    onSuccess: (data) => {
      const { token: jwt, cliente } = data.data;
      login(jwt, {
        id: cliente.usuarioId,
        clienteId: cliente.id,
        correo: invitacion.correo,
        nombre: cliente.nombre ?? "Cliente",
        apellido: cliente.apellido,
        rol: "CLIENTE",
        workspaceId: cliente.espacioDeTrabajoId,
      });
      toast.success("Cuenta creada correctamente", {
        description: "Te estamos redirigiendo a tu plan de entrenamiento.",
      });
      router.replace("/cliente/planes");
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

  if (!valida || !invitacion) {
    return (
      <Card>
        <CardHeader><CardTitle>Invitación no válida</CardTitle></CardHeader>
        <CardContent>
          <p className="text-red-500">Esta invitación ha expirado o ya fue utilizada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Completa tu registro</CardTitle>
        <CardDescription>Ingresa tus datos para unirte</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => {
            if (mutation.isPending) {return;}
            mutation.mutate({ ...data, correo: invitacion.correo });
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" value={invitacion.correo} disabled />
            <input type="hidden" {...register("correo")} />
            {errors.correo && <p className="text-sm text-red-500">{errors.correo.message}</p>}
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
              {errors.apellido && <p className="text-sm text-red-500">{errors.apellido.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contrasena">Contraseña</Label>
            <Input id="contrasena" type="password" {...register("contrasena")} placeholder="••••••" />
            {errors.contrasena && <p className="text-sm text-red-500">{errors.contrasena.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvitacionPage;