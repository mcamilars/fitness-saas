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
});
