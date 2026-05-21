export const WORKSPACE_OWNERSHIP_METADATA = 'workspace_ownership';

export interface WorkspaceOwnershipResolver {
  resolveWorkspaceId(resourceId: string): Promise<string | null>;
}

export interface WorkspaceOwnershipMetadata {
  resolverToken: string | symbol;
  paramKey: string;
  source: 'params' | 'body' | 'query';
}
