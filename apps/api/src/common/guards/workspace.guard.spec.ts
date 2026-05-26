import {
  type ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EspaciosDeTrabajoRepository } from '../../modules/espacios-de-trabajo/repositories/espacios-de-trabajo.repository';
import { WorkspaceRegistry } from '../../modules/registry/workspace.registry';
import { WorkspaceGuard } from './workspace.guard';
import {
  WORKSPACE_OWNERSHIP_METADATA,
  type WorkspaceOwnershipMetadata,
} from './workspace-ownership.types';

describe('WorkspaceGuard', () => {
  const RESOLVER_TOKEN = 'OWNERSHIP_RESOLVER';

  const metadataPorDefecto: WorkspaceOwnershipMetadata = {
    resolverToken: RESOLVER_TOKEN,
    paramKey: 'id',
    source: 'params',
  };

  interface Opciones {
    workspaceId?: string;
    sinUsuario?: boolean;
    params?: Record<string, unknown>;
    metadata?: WorkspaceOwnershipMetadata | undefined;
    workspaceEnDb?: { id: string; slug: string; nombre: string } | null;
    workspaceIdRecurso?: string | null;
  }

  const construir = (opciones: Opciones) => {
    const {
      workspaceId = 'workspace-1',
      sinUsuario = false,
      params = {},
      metadata,
      workspaceEnDb = { id: workspaceId, slug: 'ws', nombre: 'WS' },
      workspaceIdRecurso = workspaceId,
    } = opciones;

    const request = { user: sinUsuario ? undefined : { workspaceId }, params };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    } as unknown as ExecutionContext;

    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(metadata),
    };
    const espaciosDeTrabajoRepository = {
      findById: jest.fn().mockResolvedValue(workspaceEnDb),
    };
    const resolver = {
      resolveWorkspaceId: jest.fn().mockResolvedValue(workspaceIdRecurso),
    };
    const moduleRef = {
      get: jest.fn((token: unknown) =>
        token === EspaciosDeTrabajoRepository
          ? espaciosDeTrabajoRepository
          : resolver,
      ),
    };

    const guard = new WorkspaceGuard(reflector as never, moduleRef as never);

    return { guard, ctx, espaciosDeTrabajoRepository, resolver };
  };

  it('lanza Forbidden cuando el usuario no tiene workspace asociado', async () => {
    const { guard, ctx } = construir({ sinUsuario: true });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('registra el workspace desde la DB cuando no está en el registry', async () => {
    const workspaceId = 'workspace-fallback-guard';
    const { guard, ctx, espaciosDeTrabajoRepository } = construir({
      workspaceId,
      metadata: undefined,
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(espaciosDeTrabajoRepository.findById).toHaveBeenCalledWith(workspaceId);
    expect(WorkspaceRegistry.getInstance().buscar(workspaceId)).toBeDefined();
  });

  it('no consulta la DB cuando el workspace ya está en el registry', async () => {
    const workspaceId = 'workspace-ya-registrado-guard';
    WorkspaceRegistry.getInstance().registrar({
      id: workspaceId,
      slug: 'ya',
      nombre: 'Ya registrado',
    });
    const { guard, ctx, espaciosDeTrabajoRepository } = construir({
      workspaceId,
      metadata: undefined,
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(espaciosDeTrabajoRepository.findById).not.toHaveBeenCalled();
  });

  it('lanza Forbidden cuando el workspace del usuario no existe en la DB', async () => {
    const { guard, ctx } = construir({
      workspaceId: 'workspace-inexistente-guard',
      workspaceEnDb: null,
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('retorna true cuando no hay metadata de ownership', async () => {
    const { guard, ctx, resolver } = construir({ metadata: undefined });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(resolver.resolveWorkspaceId).not.toHaveBeenCalled();
  });

  it('lanza Forbidden cuando falta el identificador del recurso', async () => {
    const { guard, ctx } = construir({
      metadata: metadataPorDefecto,
      params: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('lanza NotFound cuando el resolver no encuentra el recurso', async () => {
    const { guard, ctx } = construir({
      metadata: metadataPorDefecto,
      params: { id: 'recurso-1' },
      workspaceIdRecurso: null,
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lanza Forbidden cuando el recurso pertenece a otro workspace', async () => {
    const { guard, ctx } = construir({
      workspaceId: 'workspace-1',
      metadata: metadataPorDefecto,
      params: { id: 'recurso-1' },
      workspaceIdRecurso: 'workspace-ajeno',
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('retorna true cuando el recurso pertenece al workspace del usuario', async () => {
    const workspaceId = 'workspace-ownership-ok';
    const { guard, ctx, resolver } = construir({
      workspaceId,
      metadata: metadataPorDefecto,
      params: { id: 'recurso-1' },
      workspaceIdRecurso: workspaceId,
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(resolver.resolveWorkspaceId).toHaveBeenCalledWith('recurso-1');
  });

  it('lee el metadata combinando handler y clase via reflector', async () => {
    const { guard, ctx } = construir({ metadata: undefined });

    await guard.canActivate(ctx);

    const reflector = (guard as unknown as { reflector: { getAllAndOverride: jest.Mock } })
      .reflector;
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      WORKSPACE_OWNERSHIP_METADATA,
      ['handler', 'class'],
    );
  });
});
