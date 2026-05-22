import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-request';
import {
  WORKSPACE_OWNERSHIP_METADATA,
  type WorkspaceOwnershipMetadata,
  type WorkspaceOwnershipResolver,
} from './workspace-ownership.types';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const workspaceIdUsuario = request.user?.workspaceId;
    if (!workspaceIdUsuario) {
      throw new ForbiddenException('Usuario sin workspace asociado');
    }

    const metadata = this.reflector.getAllAndOverride<
      WorkspaceOwnershipMetadata | undefined
    >(WORKSPACE_OWNERSHIP_METADATA, [ctx.getHandler(), ctx.getClass()]);

    if (!metadata) {
      return true;
    }

    const resourceId = this.extraerResourceId(request, metadata);
    if (!resourceId) {
      throw new ForbiddenException(
        `Falta identificador del recurso en ${metadata.source}.${metadata.paramKey}`,
      );
    }

    const resolver = this.moduleRef.get<WorkspaceOwnershipResolver>(
      metadata.resolverToken,
      { strict: false },
    );

    const workspaceIdRecurso = await resolver.resolveWorkspaceId(resourceId);
    if (workspaceIdRecurso === null) {
      throw new NotFoundException('Recurso no encontrado');
    }

    if (workspaceIdRecurso !== workspaceIdUsuario) {
      throw new ForbiddenException('El recurso no pertenece a tu workspace');
    }

    return true;
  }

  private extraerResourceId(
    request: Request,
    metadata: WorkspaceOwnershipMetadata,
  ): string | undefined {
    const contenedor = request[metadata.source] as
      | Record<string, unknown>
      | undefined;
    const valor = contenedor?.[metadata.paramKey];
    return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
  }
}
