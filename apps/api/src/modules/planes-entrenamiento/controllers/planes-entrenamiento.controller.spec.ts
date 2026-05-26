import { TipoPlanEntrenamiento } from '@repo/database';
import { PlanesEntrenamientoController } from './planes-entrenamiento.controller';

describe('PlanesEntrenamientoController', () => {
  const service = {
    crearParaUsuario: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    activar: jest.fn(),
    archivar: jest.fn(),
    duplicar: jest.fn(),
    agregarEjercicio: jest.fn(),
    quitarEjercicio: jest.fn(),
  };

  const commandInvoker = { ejecutar: jest.fn() };

  let controller: PlanesEntrenamientoController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PlanesEntrenamientoController(
      service as never,
      commandInvoker as never,
    );
  });

  it('POST /planes-entrenamiento crea plan para el usuario autenticado', async () => {
    const dto = {
      nombre: 'Plan fuerza',
      tipo: TipoPlanEntrenamiento.FUERZA,
    };
    service.crearParaUsuario.mockResolvedValue({ id: 'plan-1' });

    await controller.crear(dto, {
      id: 'usuario-1',
      rol: 'ENTRENADOR',
      workspaceId: 'workspace-1',
    });

    expect(service.crearParaUsuario).toHaveBeenCalledWith(dto, 'usuario-1');
  });

  it('GET /planes-entrenamiento lista por workspace', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll('workspace-1');

    expect(service.findAll).toHaveBeenCalledWith('workspace-1');
  });

  it('PATCH /:id/activar activa el plan', async () => {
    service.activar.mockResolvedValue({ id: 'plan-1' });

    await controller.activar('plan-1', 'workspace-1');

    expect(service.activar).toHaveBeenCalledWith('plan-1', 'workspace-1');
  });

  it('PATCH /:id/archivar pasa por CommandInvoker con ArchivarPlanCommand', async () => {
    commandInvoker.ejecutar.mockResolvedValue({ id: 'plan-1' });

    await controller.archivar('plan-1', 'workspace-1');

    expect(commandInvoker.ejecutar).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion: expect.any(Function) }),
    );
  });

  it('POST /:id/ejercicios agrega ejercicio al plan', async () => {
    const dto = {
      ejercicioId: 'ejercicio-1',
      series: 4,
      repeticiones: 10,
      orden: 1,
    };
    service.agregarEjercicio.mockResolvedValue({ id: 'ejercicio-plan-1' });

    await controller.agregarEjercicio('plan-1', dto, 'workspace-1');

    expect(service.agregarEjercicio).toHaveBeenCalledWith(
      'plan-1',
      dto,
      'workspace-1',
    );
  });
});
