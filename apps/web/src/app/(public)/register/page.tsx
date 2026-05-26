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
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

const registerSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().optional(),
  nombreWorkspace: z.string().min(2, "Mínimo 2 caracteres"),
});

type RegisterForm = z.infer<typeof registerSchema>;

async function registerUser(data: RegisterForm) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.mensaje || "Error al registrarse");
  }
  return res.json();
}

const RegisterPage = () => {
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      login(data.token, data.usuario);
      router.push("/workspace");
    },
    onError: showApiError,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Regístrate como entrenador</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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
            <Label htmlFor="nombreWorkspace">Nombre del espacio de trabajo</Label>
            <Input id="nombreWorkspace" {...register("nombreWorkspace")} placeholder="Mi Gym" />
            {errors.nombreWorkspace && <p className="text-sm text-red-500">{errors.nombreWorkspace.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" {...register("correo")} placeholder="correo@ejemplo.com" />
            {errors.correo && <p className="text-sm text-red-500">{errors.correo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contrasena">Contraseña</Label>
            <Input id="contrasena" type="password" {...register("contrasena")} placeholder="••••••" />
            {errors.contrasena && <p className="text-sm text-red-500">{errors.contrasena.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm">
            ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterPage;