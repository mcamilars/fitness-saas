"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Users,
  Dumbbell,
  ListChecks,
  LogOut,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/workspace", label: "Clientes", icon: Users },
  { href: "/workspace/planes", label: "Planes", icon: ListChecks },
  { href: "/workspace/ejercicios", label: "Ejercicios", icon: Dumbbell },
];

export function SidebarEntrenador() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.nombre[0] ?? ""}${user.apellido?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <aside className="flex h-full w-64 flex-col bg-[#1A1C1D]">
      <div className="flex h-12 items-center px-2 py-4">
        <Link href="/workspace" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8E874]">
            <Dumbbell className="h-5 w-5 text-[#1A1C1D]" />
          </div>
          <span className="text-base font-semibold text-white">FitSaaS</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/workspace" && pathname.startsWith(item.href));
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
        <div className="rounded-2xl bg-[#C8E874] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-[#1A1C1D]" />
            <span className="text-xs font-semibold text-[#1A1C1D]">Plan Profesional</span>
          </div>
          <p className="text-xs text-[#1A1C1D]/70 mb-3">Atrae nuevos clientes e invitalos a tu plataforma.</p>
          <button className="w-full rounded-full bg-[#1A1C1D] px-4 py-2 text-xs font-semibold text-white">
            Actualizar plan
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors hover:bg-[#2D3134]">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#2D3134] text-[#C8E874] text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium text-white">{user?.nombre}</p>
                <p className="text-xs text-[#6B7280]">{user?.correo}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl border-[#2D3134] bg-[#1A1C1D]">
            <DropdownMenuItem className="flex items-center gap-2 text-[#EF4444] cursor-pointer rounded-lg">
              <LogOut className="h-4 w-4" />
              <button onClick={logout} className="w-full text-left">
                Cerrar sesión
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
