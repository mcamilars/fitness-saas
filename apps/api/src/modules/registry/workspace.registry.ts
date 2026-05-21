export interface WorkspaceRegistrado {
  id: string;
  slug: string;
  nombre: string;
}

export class WorkspaceRegistry {
  private static instance: WorkspaceRegistry | null = null;

  private readonly workspaces = new Map<string, WorkspaceRegistrado>();

  private constructor() {
    // Impide instancias externas; usar WorkspaceRegistry.getInstance().
  }

  static getInstance(): WorkspaceRegistry {
    WorkspaceRegistry.instance ??= new WorkspaceRegistry();
    return WorkspaceRegistry.instance;
  }

  registrar(workspace: WorkspaceRegistrado): void {
    this.workspaces.set(workspace.id, { ...workspace });
  }

  buscar(id: string): WorkspaceRegistrado | undefined {
    const workspace = this.workspaces.get(id);
    return workspace ? { ...workspace } : undefined;
  }

  listar(): WorkspaceRegistrado[] {
    return Array.from(this.workspaces.values(), (workspace) => ({
      ...workspace,
    }));
  }
}
