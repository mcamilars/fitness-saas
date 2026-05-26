"use client";

import { toast } from "sonner";

export function showApiError(error: unknown) {
  if (error instanceof Error && error.message) {
    toast.error(error.message);
  }
}