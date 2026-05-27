"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardPlus, Dumbbell, LogOut, ScrollText } from "lucide-react";
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
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <Link href="/cliente/planes" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-slate-900">FitSaaS</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-xs text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-slate-900">{user?.nombre}</p>
                <p className="truncate text-xs text-slate-500">{user?.correo}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="flex items-center gap-2 text-red-600" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
