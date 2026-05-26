import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EstadoAsignacion, EstadoPlan, TipoPlanEntrenamiento } from '@repo/database';
import { AsignacionesService } from './asignaciones.service';

describe('AsignacionesService', () => {
  const cliente = {
    id: 'cliente-1',
    usuarioId: 'usuario-cliente-1',
    entrenadorId: 'entrenador-1',
    espacioDeTrabajoId: 'workspace-1',
    estaActivo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    usuario: {
      id: 'usuario-cliente-1',
      correo: 'cliente@test.com',
      contrasenaHash: 'hash',
      nombre: 'Cliente',
      apellido: 'Test',
      rol: 'CLIENTE',
      estaActivo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  };
  const plan = {
    id: 'plan-1',
    entrenadorId: 'entrenador-1',
    nombre: 'Plan activo',
    descripcion: null,
    tipo: TipoPlanEntrenamiento.HIPERTROFIA,
    estado: EstadoPlan.ACTIVO,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    entrenador: {
      id: 'entrenador-1',
      usuarioId: 'usuario-entrenador-1',
      espacioDeTrabajoId: 'workspace-1',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
    ejercicioPlanes: [],
  };

  const asignacionesRepository = {
    crear: jest.fn(),
    updateEstado: jest.fn(),
    findById: jest.fn(),
  };
  const planesRepository = {
    findByIdConEjercicios: jest.fn(),
  };
  const clientesRepository = {
    findByIdConPerfil: jest.fn(),
  };
  const notificacionesRepository = { crear: jest.fn() };
  const planSubject = {
    subscribe: jest.fn(),
    notify: jest.fn().mockResolvedValue(undefined),
  };
  const mailer = { enviarCambioPlan: jest.fn() };

  let service: AsignacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AsignacionesService(
      asignacionesRepository as never,
      planesRepository as never,
      clientesRepository as never,
      notificacionesRepository as never,
      planSubject as never,
      mailer as never,
    );
  });

  it('asignarEntrenamiento valida cliente y plan, crea asignación y suscribe observers', async () => {
    clientesRepository.findByIdConPerfil.mockResolvedValue(cliente);
    planesRepository.findByIdConEjercicios.mockResolvedValue(plan);
    asignacionesRepository.crear.mockResolvedValue({ id: 'asignacion-1' });

    await service.asignarEntrenamiento(
      { clienteId: 'cliente-1', planEntrenamientoId: 'plan-1' },
      'workspace-1',
    );

    expect(asignacionesRepository.crear).toHaveBeenCalledWith({
      clienteId: 'cliente-1',
      planDeEntrenamientoId: 'plan-1',
      estado: EstadoAsignacion.ACTIVO,
    });
    expect(planSubject.subscribe).toHaveBeenCalledTimes(2);
    expect(planSubject.subscribe).toHaveBeenNthCalledWith(
      1,
      'plan-1',
      expect.objectContaining({}),
    );
    expect(planSubject.subscribe).toHaveBeenNthCalledWith(
      2,
      'plan-1',
      expect.objectContaining({}),
    );
  });

  it('lanza NotFound si no existe el cliente', async () => {
    clientesRepository.findByIdConPerfil.mockResolvedValue(null);

    await expect(
      service.asignarEntrenamiento(
        { clienteId: 'cliente-1', planEntrenamientoId: 'plan-1' },
        'workspace-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza Forbidden si el plan no pertenece al workspace', async () => {
    clientesRepository.findByIdConPerfil.mockResolvedValue(cliente);
    planesRepository.findByIdConEjercicios.mockResolvedValue({
      ...plan,
      entrenador: { ...plan.entrenador, espacioDeTrabajoId: 'workspace-2' },
    });

    await expect(
      service.asignarEntrenamiento(
        { clienteId: 'cliente-1', planEntrenamientoId: 'plan-1' },
        'workspace-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lanza BadRequest si el plan no está activo', async () => {
    clientesRepository.findByIdConPerfil.mockResolvedValue(cliente);
    planesRepository.findByIdConEjercicios.mockResolvedValue({
      ...plan,
      estado: EstadoPlan.BORRADOR,
    });

    await expect(
      service.asignarEntrenamiento(
        { clienteId: 'cliente-1', planEntrenamientoId: 'plan-1' },
        'workspace-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cambiarEstado delega al repositorio', async () => {
    asignacionesRepository.findById.mockResolvedValue({ id: 'asignacion-1' });
    asignacionesRepository.updateEstado.mockResolvedValue({ id: 'asignacion-1' });

    await service.cambiarEstado('asignacion-1', EstadoAsignacion.INACTIVO);

    expect(asignacionesRepository.updateEstado).toHaveBeenCalledWith(
      'asignacion-1',
      EstadoAsignacion.INACTIVO,
    );
  });

  it('cambiarEstado lanza NotFound si la asignación no existe', async () => {
    asignacionesRepository.findById.mockResolvedValue(null);

    await expect(
      service.cambiarEstado('inexistente', EstadoAsignacion.INACTIVO),
    ).rejects.toThrow('Asignación no encontrada');
    expect(asignacionesRepository.updateEstado).not.toHaveBeenCalled();
  });
});
