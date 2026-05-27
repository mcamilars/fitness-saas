"use client";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitaciones"] });
      toast.success("Invitación enviada", {
        description: "Se envió el correo de invitación al cliente.",
      });
      handleClose(false);
    },
    onError: showApiError,
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
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
      </DialogContent>
    </Dialog>
  );
}