import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@repo/database';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!requiredRoles.includes(user.rol)) {
      throw new ForbiddenException('Rol insuficiente para acceder al recurso');
    }

    return true;
  }
}
