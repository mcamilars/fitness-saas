import { EstadoAsignacion } from '@repo/database';
import { AsignacionesController } from './asignaciones.controller';

describe('AsignacionesController', () => {
  const service = {
    asignarEntrenamiento: jest.fn(),
    cambiarEstado: jest.fn(),
  };
  const repository = {
    findPorCliente: jest.fn(),
  };

  let controller: AsignacionesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AsignacionesController(service as never, repository as never);
  });

  it('asigna entrenamiento usando el workspace actual', async () => {
    const dto = { clienteId: 'cliente-1', planEntrenamientoId: 'plan-1' };
    service.asignarEntrenamiento.mockResolvedValue({ id: 'asignacion-1' });

    await controller.asignarEntrenamiento(dto, 'workspace-1');

    expect(service.asignarEntrenamiento).toHaveBeenCalledWith(
      dto,
      'workspace-1',
    );
  });

  it('lista asignaciones por cliente', async () => {
    repository.findPorCliente.mockResolvedValue([]);

    await controller.findPorCliente('cliente-1');

    expect(repository.findPorCliente).toHaveBeenCalledWith('cliente-1');
  });

  it('cambia estado de asignación', async () => {
    service.cambiarEstado.mockResolvedValue({ id: 'asignacion-1' });

    await controller.cambiarEstado('asignacion-1', {
      estado: EstadoAsignacion.INACTIVO,
    });

    expect(service.cambiarEstado).toHaveBeenCalledWith(
      'asignacion-1',
      EstadoAsignacion.INACTIVO,
    );
  });
});
