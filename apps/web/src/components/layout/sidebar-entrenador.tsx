"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Users,
  Dumbbell,
  ListChecks,
  LogOut,
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
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <Link href="/workspace" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-slate-900">FitSaaS</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/workspace" && pathname.startsWith(item.href));
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
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-900">{user?.nombre}</p>
                <p className="text-xs text-slate-500">{user?.correo}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="flex items-center gap-2 text-red-600">
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