import { toast } from "sonner";

interface ToastConUndoOptions {
  mensaje: string;
  onUndo: () => Promise<void>;
}

export function toastConUndo({ mensaje, onUndo }: ToastConUndoOptions) {
  toast.success(mensaje, {
    duration: 8000,
    action: {
      label: "Deshacer",
      onClick: async () => {
        try {
          await onUndo();
          toast.success("Acción deshecha");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "No se pudo deshacer la acción");
        }
      },
    },
  });
}
