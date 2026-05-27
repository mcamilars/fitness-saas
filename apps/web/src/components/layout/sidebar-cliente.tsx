"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardPlus, Dumbbell, LogOut, ScrollText, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/cliente/planes", label: "Mis planes", icon: ScrollText },
  { href: "/cliente/registrar", label: "Registrar", icon: ClipboardPlus },
  { href: "/cliente/progreso", label: "Progreso", icon: BarChart3 },
];

export function SidebarCliente() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.nombre[0] ?? ""}${user.apellido?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <aside className="flex h-full w-64 flex-col bg-[#1A1C1D]">
      <div className="flex h-12 items-center px-2 py-4">
        <Link href="/cliente/planes" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8E874]">
            <Dumbbell className="h-5 w-5 text-[#1A1C1D]" />
          </div>
          <span className="text-base font-semibold text-white">FitSaaS</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white text-[#1A1C1D]"
                  : "text-[#9CA3AF] hover:bg-[#2D3134] hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-[#1A1C1D]" : "text-[#9CA3AF]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-shrink-0 space-y-3 px-3 py-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#C8E874] to-[#A8D860] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-[#1A1C1D]" />
            <span className="text-xs font-semibold text-[#1A1C1D]">Racha activa</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1C1D]">7 días</p>
          <p className="text-xs text-[#1A1C1D]/70 mt-1">¡Sigue así!</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors hover:bg-[#2D3134]">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#2D3134] text-[#C8E874] text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-white">{user?.nombre}</p>
                <p className="truncate text-xs text-[#6B7280]">{user?.correo}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl border-[#2D3134] bg-[#1A1C1D]">
            <DropdownMenuItem className="flex items-center gap-2 text-[#EF4444] cursor-pointer rounded-lg" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
