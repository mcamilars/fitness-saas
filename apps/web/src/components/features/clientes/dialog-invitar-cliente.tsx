"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Code } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { showApiError } from "@/lib/hooks/use-api-error-toast";
import { toastConUndo } from "@/lib/ui/toast-undo";
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
  const [tokenMostrado, setTokenMostrado] = useState<string | null>(null);

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
      setTokenMostrado(data.tokenInvitacion);
      toastConUndo({
        mensaje: "Invitación enviada",
        onUndo: async () => {
          await apiFetch(`/api/commands/undo`, { method: "POST" });
          queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
        },
      });
      queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
    },
    onError: showApiError,
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setTokenMostrado(null);
    }
    onOpenChange(open);
  };

  const copiarToken = () => {
    if (tokenMostrado) {
      navigator.clipboard.writeText(tokenMostrado);
      toast.success("Token copiado al portapapeles");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar cliente</DialogTitle>
          <DialogDescription>
            {tokenMostrado
              ? "Copia el token y compártelo con tu cliente."
              : "Ingresa el correo del cliente para enviarle una invitación."}
          </DialogDescription>
        </DialogHeader>

        {tokenMostrado ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-100 p-4">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-slate-700 break-all">
                  {tokenMostrado}
                </code>
                <Button size="sm" variant="ghost" onClick={copiarToken}>
                  <Code className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Este token expira en 7 días. Compártelo con tu cliente para que se registre.
            </p>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((data) => {
              if (mutation.isPending) {return;}
              mutation.mutate(data);
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                placeholder="cliente@ejemplo.com"
                disabled={mutation.isPending}
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
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {isSubmitting || mutation.isPending ? "Enviando..." : "Enviar invitación"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}