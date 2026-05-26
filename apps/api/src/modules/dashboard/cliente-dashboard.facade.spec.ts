import { EstadoPlan, TipoPlanEntrenamiento, GrupoMuscular } from '@repo/database';
import type { ClienteConPerfil } from '../clientes/repositories/clientes.repository';
import type { PlanConEjercicios } from '../planes-entrenamiento/repositories/planes-entrenamiento.repository';
import type { RegistroConEjercicios } from '../registros/repositories/registros-entrenamiento.repository';
import type { ProgresoResumen } from '../progreso/strategies/progreso-strategy.interface';
import { ClienteDashboardFacade } from './cliente-dashboard.facade';

const clienteMock: ClienteConPerfil = {
  id: 'cliente-1',
  usuarioId: 'usuario-1',
  entrenadorId: 'entrenador-1',
  espacioDeTrabajoId: 'ws-1',
  estaActivo: true,
  creadoEn: new Date('2026-01-01'),
  actualizadoEn: new Date('2026-01-01'),
  usuario: {
    id: 'usuario-1',
    correo: 'cliente@test.com',
    nombre: 'Juan',
    apellido: 'Pérez',
    rol: 'CLIENTE' as never,
    contrasena: 'hash',
    creadoEn: new Date('2026-01-01'),
    actualizadoEn: new Date('2026-01-01'),
  },
};

const planActivoMock: PlanConEjercicios = {
  id: 'plan-1',
  nombre: 'Plan Hipertrofia',
  descripcion: null,
  tipo: TipoPlanEntrenamiento.HIPERTROFIA,
  estado: EstadoPlan.ACTIVO,
  entrenadorId: 'entrenador-1',
  creadoEn: new Date('2026-01-01'),
  actualizadoEn: new Date('2026-01-01'),
  entrenador: {
    id: 'entrenador-1',
    usuarioId: 'usuario-ent-1',
    espacioDeTrabajoId: 'ws-1',
    creadoEn: new Date('2026-01-01'),
    actualizadoEn: new Date('2026-01-01'),
  },
  ejercicios: [],
};

const registroMock: RegistroConEjercicios = {
  id: 'reg-1',
  clienteId: 'cliente-1',
  fecha: new Date('2026-05-25'),
  notas: null,
  duracionMin: 60,
  creadoEn: new Date('2026-05-25'),
  ejercicios: [
    {
      id: 'ej-1',
      registroDeEntrenamientoId: 'reg-1',
      nombre: 'Press banca',
      grupoMuscular: GrupoMuscular.PECHO,
      series: 4,
      repeticiones: 10,
      pesoKg: 80,
      notas: null,
    },
  ],
};

const progresoMock: ProgresoResumen = {
  totalSesiones: 1,
  periodos: [{ etiqueta: '2026-W22', totalSesiones: 1, totalEjercicios: 1, duracionTotalMin: 60 }],
};

describe('ClienteDashboardFacade', () => {
  const clientesService = { findById: jest.fn() };
  const planesService = { findAll: jest.fn() };
  const registrosService = { listar: jest.fn() };
  const progresoService = { calcularProgreso: jest.fn() };

  let facade: ClienteDashboardFacade;

  beforeEach(() => {
    jest.clearAllMocks();
    clientesService.findById.mockResolvedValue(clienteMock);
    planesService.findAll.mockResolvedValue([planActivoMock]);
    registrosService.listar.mockResolvedValue({ registros: [registroMock], total: 1, page: 1, limit: 5 });
    progresoService.calcularProgreso.mockResolvedValue(progresoMock);

    facade = new ClienteDashboardFacade(
      clientesService as never,
      planesService as never,
      registrosService as never,
      progresoService as never,
    );
  });

  it('llama a todos los servicios con los parámetros correctos', async () => {
    await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(clientesService.findById).toHaveBeenCalledWith('cliente-1', 'ws-1');
    expect(planesService.findAll).toHaveBeenCalledWith('ws-1');
    expect(registrosService.listar).toHaveBeenCalledWith('cliente-1', { page: 1, limit: 5 });
    expect(progresoService.calcularProgreso).toHaveBeenCalledWith('cliente-1', 'semanal');
  });

  it('compone el dashboard con los cuatro bloques esperados', async () => {
    const resultado = await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(resultado).toHaveProperty('cliente');
    expect(resultado).toHaveProperty('planActivo');
    expect(resultado).toHaveProperty('ultimosRegistros');
    expect(resultado).toHaveProperty('progresoSemanal');
  });

  it('devuelve el cliente correcto', async () => {
    const resultado = await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(resultado.cliente).toEqual(clienteMock);
  });

  it('devuelve el plan activo del workspace', async () => {
    const resultado = await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(resultado.planActivo).toEqual(planActivoMock);
    expect(resultado.planActivo?.estado).toBe(EstadoPlan.ACTIVO);
  });

  it('devuelve planActivo null si no hay planes activos', async () => {
    planesService.findAll.mockResolvedValue([
      { ...planActivoMock, estado: EstadoPlan.BORRADOR },
    ]);

    const resultado = await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(resultado.planActivo).toBeNull();
  });

  it('devuelve los últimos 5 registros', async () => {
    const resultado = await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(resultado.ultimosRegistros).toEqual([registroMock]);
    expect(registrosService.listar).toHaveBeenCalledWith(
      'cliente-1',
      expect.objectContaining({ limit: 5 }),
    );
  });

  it('devuelve el progreso semanal', async () => {
    const resultado = await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(resultado.progresoSemanal).toEqual(progresoMock);
  });

  it('ejecuta las llamadas a servicios en paralelo (Promise.all)', async () => {
    const callOrder: string[] = [];
    clientesService.findById.mockImplementation(async () => { callOrder.push('clientes'); return clienteMock; });
    planesService.findAll.mockImplementation(async () => { callOrder.push('planes'); return [planActivoMock]; });
    registrosService.listar.mockImplementation(async () => { callOrder.push('registros'); return { registros: [], total: 0, page: 1, limit: 5 }; });
    progresoService.calcularProgreso.mockImplementation(async () => { callOrder.push('progreso'); return progresoMock; });

    await facade.getDashboardCliente('cliente-1', 'ws-1');

    expect(callOrder).toHaveLength(4);
  });
});
