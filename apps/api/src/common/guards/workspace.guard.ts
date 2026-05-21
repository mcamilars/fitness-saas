import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-request';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    if (!request.user?.workspaceId) {
      throw new ForbiddenException('Usuario sin workspace asociado');
    }

    return true;
  }
}
