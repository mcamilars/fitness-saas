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

const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(8, "Mínimo 8 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

async function loginClient(data: LoginForm) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.mensaje || "Error al iniciar sesión");
  }
  return res.json();
}

const LoginPage = () => {
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: loginClient,
    onSuccess: (data) => {
      const { token, usuario } = data.data;
      login(token, usuario);
      const destino = usuario.rol === "ENTRENADOR" ? "/workspace" : "/cliente/plan";
      router.push(destino);
    },
    onError: showApiError,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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
            {isSubmitting ? "Iniciando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm">
            ¿No tienes cuenta? <Link href="/register" className="text-blue-600 hover:underline">Regístrate</Link>
          </p>
        </form>
      </CardContent>
    </Card>
);
};

export default LoginPage;