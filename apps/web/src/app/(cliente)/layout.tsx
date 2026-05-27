"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { NotificacionesBell } from "@/components/layout/notificaciones-bell";
import { SidebarCliente } from "@/components/layout/sidebar-cliente";
import { useRequireAuth } from "@/lib/auth/auth-context";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useRequireAuth("CLIENTE");

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
      <SidebarCliente />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <p className="text-sm text-slate-500">Portal del cliente</p>
            <h1 className="text-lg font-semibold text-slate-900">Tu entrenamiento</h1>
          </div>
          <NotificacionesBell />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
