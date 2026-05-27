"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.rol === "ENTRENADOR") {
      router.replace("/workspace");
    } else if (user?.rol === "CLIENTE") {
      router.replace("/cliente/planes");
    }
  }, [isAuthenticated, user, router]);

  return null;
}