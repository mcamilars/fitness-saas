import { WorkspaceRegistry } from './workspace.registry';

describe('WorkspaceRegistry', () => {
  it('getInstance retorna la misma referencia', () => {
    const primeraInstancia = WorkspaceRegistry.getInstance();
    const segundaInstancia = WorkspaceRegistry.getInstance();

    expect(primeraInstancia).toBe(segundaInstancia);
  });

  it('registrar y buscar funcionan por id', () => {
    const registry = WorkspaceRegistry.getInstance();
    const workspace = {
      id: 'workspace-test-b2-5',
      slug: 'workspace-test',
      nombre: 'Workspace Test',
    };

    registry.registrar(workspace);

    expect(registry.buscar(workspace.id)).toEqual(workspace);
  });

  it('buscar retorna undefined para un id desconocido', () => {
    const registry = WorkspaceRegistry.getInstance();

    expect(registry.buscar('workspace-inexistente-xyz')).toBeUndefined();
  });

  it('buscar retorna una copia defensiva que no muta el estado interno', () => {
    const registry = WorkspaceRegistry.getInstance();
    const workspace = {
      id: 'workspace-defensivo',
      slug: 'defensivo',
      nombre: 'Defensivo',
    };
    registry.registrar(workspace);

    const copia = registry.buscar(workspace.id);
    expect(copia).toBeDefined();
    (copia as { nombre: string }).nombre = 'Mutado';

    expect(registry.buscar(workspace.id)?.nombre).toBe('Defensivo');
  });

  it('registrar copia el objeto recibido (no guarda la referencia externa)', () => {
    const registry = WorkspaceRegistry.getInstance();
    const workspace = {
      id: 'workspace-copia',
      slug: 'copia',
      nombre: 'Original',
    };
    registry.registrar(workspace);
    workspace.nombre = 'Cambiado fuera';

    expect(registry.buscar('workspace-copia')?.nombre).toBe('Original');
  });
});
