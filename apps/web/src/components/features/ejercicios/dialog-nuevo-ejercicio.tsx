"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/api-fetch";
import { showApiError } from "@/lib/hooks/use-api-error-toast";
import type { GrupoMuscular } from "@/lib/types/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ejercicioSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  grupoMuscular: z.string().min(1, "Selecciona un grupo muscular"),
  descripcion: z.string().optional(),
  instrucciones: z.string().optional(),
  imagenUrl: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
  videoUrl: z.string().url("URL de video inválida").optional().or(z.literal("")),
});

type EjercicioForm = z.infer<typeof ejercicioSchema>;

const GRUPO_LABELS: Record<GrupoMuscular, string> = {
  PECHO: "Pecho",
  ESPALDA: "Espalda",
  HOMBROS: "Hombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  PIERNAS: "Piernas",
  GLUTEOS: "Glúteos",
  CORE: "Core",
  CUERPO_COMPLETO: "Cuerpo completo",
  OTRO: "Otro",
};

async function crearEjercicio(data: EjercicioForm) {
  return apiFetch("/api/ejercicios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

interface DialogNuevoEjercicioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogNuevoEjercicio({
  open,
  onOpenChange,
}: DialogNuevoEjercicioProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EjercicioForm>({
    resolver: zodResolver(ejercicioSchema),
    defaultValues: {
      nombre: "",
      grupoMuscular: "",
      descripcion: "",
      instrucciones: "",
      imagenUrl: "",
      videoUrl: "",
    },
  });

  const mutation = useMutation({
    mutationFn: crearEjercicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ejercicios"] });
      toast.success("Ejercicio creado", {
        description: "El ejercicio se agregó al catálogo.",
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
          <DialogDescription>
            Agrega un ejercicio al catálogo de tu espacio de trabajo.
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
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Press de banca"
              disabled={mutation.isPending}
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupoMuscular">Grupo muscular *</Label>
            <Select
              onValueChange={(val) => setValue("grupoMuscular", val)}
              disabled={mutation.isPending}
            >
              <SelectTrigger id="grupoMuscular">
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(GRUPO_LABELS) as GrupoMuscular[]).map((grupo) => (
                  <SelectItem key={grupo} value={grupo}>
                    {GRUPO_LABELS[grupo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.grupoMuscular && (
              <p className="text-sm text-red-500">{errors.grupoMuscular.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              placeholder="Descripción breve del ejercicio"
              disabled={mutation.isPending}
              {...register("descripcion")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucciones">Instrucciones</Label>
            <Input
              id="instrucciones"
              placeholder="Instrucciones para realizar el ejercicio"
              disabled={mutation.isPending}
              {...register("instrucciones")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagenUrl">URL de imagen</Label>
            <Input
              id="imagenUrl"
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={mutation.isPending}
              {...register("imagenUrl")}
            />
            {errors.imagenUrl && (
              <p className="text-sm text-red-500">{errors.imagenUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL de video</Label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              disabled={mutation.isPending}
              {...register("videoUrl")}
            />
            {errors.videoUrl && (
              <p className="text-sm text-red-500">{errors.videoUrl.message}</p>
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
              {isSubmitting || mutation.isPending ? "Creando..." : "Crear ejercicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
