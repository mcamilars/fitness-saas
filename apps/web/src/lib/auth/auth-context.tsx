"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type Rol = "ENTRENADOR" | "CLIENTE";

export interface User {
  id: string;
  rol: Rol;
  workspaceId: string;
  nombre: string;
  apellido?: string;
  correo: string;
  clienteId?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") {return null;}
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {return null;}
    return localStorage.getItem(TOKEN_KEY);
  });
  const router = useRouter();

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getMiClienteId(user: User | null): string | undefined {
  return user?.clienteId ?? (user?.rol === "CLIENTE" ? user.id : undefined);
}

export function useMiClienteId(): string | undefined {
  const { user } = useAuth();
  return getMiClienteId(user);
}

export function useRequireAuth(requiredRol?: Rol) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (requiredRol && user?.rol !== requiredRol) {
      const redirectPath = user?.rol === "ENTRENADOR" ? "/workspace" : "/cliente/planes";
      router.push(redirectPath);
    }
  }, [isAuthenticated, requiredRol, router, user]);

  return { user, isAuthenticated };
}