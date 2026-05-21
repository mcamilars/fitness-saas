import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user.workspaceId;
  },
);
