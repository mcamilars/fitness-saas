"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { showApiError } from "@/lib/hooks/use-api-error-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";

const invitarSchema = z.object({
  correo: z.string().email("Correo inválido"),
});

type InvitarForm = z.infer<typeof invitarSchema>;

interface InvitacionResponse {
  tokenInvitacion: string;
  mensaje: string;
}

async function invitarCliente(data: InvitarForm): Promise<InvitacionResponse> {
  return apiFetch("/api/clientes/invitar", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

interface DialogInvitarClienteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogInvitarCliente({
  open,
  onOpenChange,
}: DialogInvitarClienteProps) {
  const queryClient = useQueryClient();
  const [tokenCopiado, setTokenCopiado] = useState<string | null>(null);
  const [tokenInvitacion, setTokenInvitacion] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvitarForm>({
    resolver: zodResolver(invitarSchema),
  });

  const mutation = useMutation({
    mutationFn: invitarCliente,
    onSuccess: (data) => {
      setTokenInvitacion(data.tokenInvitacion);
      queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
      toast.success("Invitación creada", {
        description: "Comparte el token con tu cliente.",
      });
    },
    onError: showApiError,
  });

  const handleCopyToken = async () => {
    if (!tokenInvitacion) {return;}
    await navigator.clipboard.writeText(tokenInvitacion);
    setTokenCopiado(tokenInvitacion);
    setTimeout(() => setTokenCopiado(null), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setTokenInvitacion(null);
      setTokenCopiado(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar cliente</DialogTitle>
          <DialogDescription>
            Ingresa el correo del cliente para enviarle una invitación.
          </DialogDescription>
        </DialogHeader>

        {!tokenInvitacion ? (
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="cliente@ejemplo.com"
                {...register("correo")}
              />
              {errors.correo && (
                <p className="text-sm text-red-500">{errors.correo.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar invitación"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Token de invitación
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono text-slate-800 border">
                  {tokenInvitacion}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyToken}
                  className="shrink-0"
                >
                  {tokenCopiado ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Compartí este token con tu cliente. También se envió un correo
                con el enlace directo.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}