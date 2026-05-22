import type { Rol } from '@repo/database';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  rol: Rol;
  workspaceId: string;
}

export interface AuthenticatedUser {
  id: string;
  rol: Rol;
  workspaceId: string;
}

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
