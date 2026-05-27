"use client";

import { toast } from "sonner";

export function toastConUndo({
  mensaje,
  onUndo,
}: {
  mensaje: string;
  onUndo: () => Promise<void>;
}) {
  toast(mensaje, {
    duration: 8000,
    action: {
      label: "Deshacer",
      onClick: async () => {
        try {
          await onUndo();
          toast("Acción deshecha");
        } catch {
          toast("No se pudo deshacer");
        }
      },
    },
  });
}
