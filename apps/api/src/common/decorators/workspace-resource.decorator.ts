import { SetMetadata } from '@nestjs/common';
import {
  WORKSPACE_OWNERSHIP_METADATA,
  type WorkspaceOwnershipMetadata,
} from '../guards/workspace-ownership.types';

export interface WorkspaceResourceOptions {
  resolverToken: string | symbol;
  paramKey?: string;
  source?: 'params' | 'body' | 'query';
}

export const WorkspaceResource = (
  options: WorkspaceResourceOptions,
): MethodDecorator & ClassDecorator => {
  const metadata: WorkspaceOwnershipMetadata = {
    resolverToken: options.resolverToken,
    paramKey: options.paramKey ?? 'id',
    source: options.source ?? 'params',
  };
  return SetMetadata(WORKSPACE_OWNERSHIP_METADATA, metadata);
};
