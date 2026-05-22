import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { EspaciosDeTrabajoRepository } from '../../modules/espacios-de-trabajo/repositories/espacios-de-trabajo.repository';
import { WorkspaceRegistry } from '../../modules/registry/workspace.registry';
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

    await this.registrarWorkspaceSiNoExiste(workspaceIdUsuario);

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

  private async registrarWorkspaceSiNoExiste(workspaceId: string): Promise<void> {
    const registry = WorkspaceRegistry.getInstance();
    if (registry.buscar(workspaceId)) {
      return;
    }

    const espaciosDeTrabajoRepository =
      this.moduleRef.get<EspaciosDeTrabajoRepository>(
        EspaciosDeTrabajoRepository,
        { strict: false },
      );

    const workspace = await espaciosDeTrabajoRepository.findById(workspaceId);
    if (!workspace) {
      throw new ForbiddenException('El workspace del usuario no existe');
    }

    registry.registrar({
      id: workspace.id,
      slug: workspace.slug,
      nombre: workspace.nombre,
    });
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
