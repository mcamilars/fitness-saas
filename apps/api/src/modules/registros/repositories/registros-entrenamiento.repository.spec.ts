import { GrupoMuscular } from '@repo/database';
import { RegistrosEntrenamientoRepository } from './registros-entrenamiento.repository';
import type { RegistroEntrenamientoDraft } from '../builders/registro-entrenamiento.builder';

describe('RegistrosEntrenamientoRepository', () => {
  const mockRegistro = {
    id: 'registro-1',
    clienteId: 'cliente-1',
    fecha: new Date('2026-05-25'),
    notas: 'buena sesion',
    duracionMin: 60,
    creadoEn: new Date(),
    ejercicios: [
      {
        id: 'rej-1',
        registroDeEntrenamientoId: 'registro-1',
        nombre: 'Press banca',
        grupoMuscular: GrupoMuscular.PECHO,
        series: 4,
        repeticiones: 10,
        pesoKg: 80,
        notas: null,
      },
    ],
  };

  const prisma = {
    registroDeEntrenamiento: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  let repository: RegistrosEntrenamientoRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new RegistrosEntrenamientoRepository(prisma as never);
  });

  describe('crearConEjercicios', () => {
    it('crea el registro con sus ejercicios en una sola operación', async () => {
      prisma.registroDeEntrenamiento.create.mockResolvedValue(mockRegistro);

      const payload: Readonly<RegistroEntrenamientoDraft> = Object.freeze({
        clienteId: 'cliente-1',
        fecha: new Date('2026-05-25'),
        notas: 'buena sesion',
        duracionMin: 60,
        ejercicios: [
          {
            nombre: 'Press banca',
            grupoMuscular: GrupoMuscular.PECHO,
            series: 4,
            repeticiones: 10,
            pesoKg: 80,
          },
        ],
      });

      const result = await repository.crearConEjercicios(payload);

      expect(prisma.registroDeEntrenamiento.create).toHaveBeenCalledWith({
        data: {
          clienteId: 'cliente-1',
          fecha: payload.fecha,
          notas: 'buena sesion',
          duracionMin: 60,
          ejercicios: {
            create: [
              {
                nombre: 'Press banca',
                grupoMuscular: GrupoMuscular.PECHO,
                series: 4,
                repeticiones: 10,
                pesoKg: 80,
                notas: undefined,
              },
            ],
          },
        },
        include: { ejercicios: true },
      });
      expect(result).toEqual(mockRegistro);
    });

    it('usa el TransactionClient cuando se pasa tx', async () => {
      const txMock = {
        registroDeEntrenamiento: {
          create: jest.fn().mockResolvedValue(mockRegistro),
        },
      };

      const payload: Readonly<RegistroEntrenamientoDraft> = Object.freeze({
        clienteId: 'cliente-1',
        fecha: new Date('2026-05-25'),
        ejercicios: [
          {
            nombre: 'Sentadilla',
            grupoMuscular: GrupoMuscular.PIERNAS,
            series: 3,
            repeticiones: 12,
          },
        ],
      });

      await repository.crearConEjercicios(payload, txMock as never);

      expect(txMock.registroDeEntrenamiento.create).toHaveBeenCalled();
      expect(prisma.registroDeEntrenamiento.create).not.toHaveBeenCalled();
    });
  });

  describe('listarPorCliente', () => {
    it('pagina correctamente con defaults page=1 y limit=10', async () => {
      prisma.registroDeEntrenamiento.findMany.mockResolvedValue([mockRegistro]);
      prisma.registroDeEntrenamiento.count.mockResolvedValue(1);

      const result = await repository.listarPorCliente('cliente-1', {});

      expect(prisma.registroDeEntrenamiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clienteId: 'cliente-1' },
          skip: 0,
          take: 10,
          include: { ejercicios: true },
          orderBy: { fecha: 'desc' },
        }),
      );
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('aplica filtros de fecha desde/hasta cuando se proporcionan', async () => {
      prisma.registroDeEntrenamiento.findMany.mockResolvedValue([]);
      prisma.registroDeEntrenamiento.count.mockResolvedValue(0);

      const desde = new Date('2026-05-01');
      const hasta = new Date('2026-05-31');

      await repository.listarPorCliente('cliente-1', { desde, hasta, page: 2, limit: 5 });

      expect(prisma.registroDeEntrenamiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            clienteId: 'cliente-1',
            fecha: { gte: desde, lte: hasta },
          },
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findPorClienteConDetalle', () => {
    it('retorna todos los registros del cliente con ejercicios incluidos', async () => {
      prisma.registroDeEntrenamiento.findMany.mockResolvedValue([mockRegistro]);

      const result = await repository.findPorClienteConDetalle('cliente-1');

      expect(prisma.registroDeEntrenamiento.findMany).toHaveBeenCalledWith({
        where: { clienteId: 'cliente-1' },
        include: { ejercicios: true },
        orderBy: { fecha: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
