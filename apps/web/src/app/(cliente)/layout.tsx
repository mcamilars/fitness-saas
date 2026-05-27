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
      <div className="flex h-screen items-center justify-center bg-[#1A1C1D]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C8E874]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#1A1C1D] p-2 lg:p-4">
      <div className="flex w-full gap-2">
        <div className="sticky top-2 h-[calc(100vh-16px)] w-64 flex-shrink-0 self-start">
          <SidebarCliente />
        </div>
        <div className="relative min-h-[calc(100vh-16px)] flex-1 overflow-y-auto rounded-[24px] bg-[#F4F4F4] p-4 lg:p-6">
          <div className="absolute right-6 top-4 z-10">
            <NotificacionesBell />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
