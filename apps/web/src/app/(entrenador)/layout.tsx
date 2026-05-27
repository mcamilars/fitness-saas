"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/auth/auth-context";
import { SidebarEntrenador } from "@/components/layout/sidebar-entrenador";
import { Loader2 } from "lucide-react";

export default function EntrenadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useRequireAuth("ENTRENADOR");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const showLoader = !mounted || !isAuthenticated;

  if (showLoader) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarEntrenador />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}